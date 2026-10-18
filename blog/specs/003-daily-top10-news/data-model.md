# Data Model: 每日热门前十资讯博客

存储为 MySQL。连接信息按 `DB_PROFILE` 切换：`test` 用后端根目录 `.env.test` 里的 `MYSQL_TEST_*`（本地 MySQL），`prod` 用 `.env.prod` 里的 `MYSQL_PROD_*`（部署机连 `116.62.78.39`）。所选环境的主机或账号为空时回退到 `DB_PATH` 指向的 `node:sqlite` 单文件（仅离线试跑与测试）。日期一律为 `YYYY-MM-DD`（Asia/Shanghai），时间为 ISO-8601 UTC。所有表由 server 目录（`~/jekyll/shamingai.github.io.server/migrations/`）下的迁移脚本创建，结构以 `migrations/001_init.sql`（MySQL 方言）为准。

SQLite 回退时迁移脚本由 `server/src/db.js` 的 `toSqliteStatements` 改写：内联 `KEY` 丢弃，`UNIQUE KEY` 改成同名唯一索引，生成列降级为普通列并用 `AFTER INSERT` / `AFTER UPDATE` 触发器写同一个表达式。查询侧单行 `INSERT … ON DUPLICATE KEY UPDATE` 被改写成 `INSERT OR REPLACE`，因此未列出列的默认值会被重置；所以凡是"冲突保留旧行"的 upsert，一律写成 `INSERT … SELECT … WHERE NOT EXISTS`，不去依赖这条改写。

## SourceSite — 来源站点（表 `source_sites`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | VARCHAR(64) PK | 短标识，如 `weibo-hot` |
| `name` | VARCHAR(120) | 显示名称，如「微博热搜」 |
| `home_url` | TEXT | 站点地址 |
| `hot_list_url` | TEXT | 热榜入口 |
| `adapter` | VARCHAR(64) | 适配器键，决定用哪个解析器 |
| `weight` | DOUBLE | 热度权重，默认 1 |
| `max_candidates` | INT | 每站最多取多少条候选，默认 20 |
| `enabled` | TINYINT | 1 启用，0 停用（`CHECK enabled IN (0, 1)`） |
| `created_at` / `updated_at` | VARCHAR(32) | |

约束：`adapter` 必须在 `server/src/sources/index.js` 注册，否则该站点本次记为失败。种子数据（`seedSites`）只在表里没有该 `id` 时插入，已存在的行保留库里的人工调整。

## PickedItem — 入选资讯（表 `picked_items`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `digest_date` | VARCHAR(10) | 所属资讯博客日期，引用 `digests(digest_date)`，级联删除 |
| `rank_no` | INT | 1..N |
| `url` | TEXT | 原文链接 |
| `title` | TEXT | 整理后的标题（英文原文可保留原题 + 中文副标题） |
| `site_id` | VARCHAR(64) | 主要来源站点 |
| `site_name` | VARCHAR(120) | 主要来源站点的显示名称（生成时快照，站点改名不影响历史条目） |
| `site_rank` | INT | 在该站点的排位 |
| `mention_count` | INT | 被几个站点同时提到，默认 1 |
| `summary` | TEXT | ≤200 字 |
| `reason` | TEXT | ≤100 字 |
| `published_at` | VARCHAR(32) NULL | |
| `url_key` | VARCHAR(700) 生成列 | `LEFT(url, 700) STORED`，只为够得着唯一键的长度上限 |

约束：主键 `(digest_date, rank_no)`；唯一键 `picked_items_url (digest_date, url_key)`——同一天同一链接不重复。

## DailyDigest — 每日资讯博客（表 `digests`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `digest_date` | VARCHAR(10) PK | 上海时间日期，如 `2026-10-18` |
| `slug` | VARCHAR(191) UNIQUE | 文章 slug，`daily-2026-10-18` |
| `title` | TEXT | 如「2026-10-18 今日热门前十」 |
| `item_count` | INT | 实际收录条数（1～`DIGEST_SIZE`） |
| `note` | TEXT NULL | 不足十条时的原因说明（写明哪些站点不可用、哪些条目被剔除）；十条齐全时为 `NULL` |
| `status` | VARCHAR(16) | `generated` / `replaced` / `failed`（`CHECK` 限定三值） |
| `generated_at` | VARCHAR(32) | |
| `markdown_path` | TEXT | 落盘路径，相对 `SITE_REPO_DIR`，即 `blog/content/posts/daily-YYYY-MM-DD.md` |

约束：`digest_date` 为主键 → 同日最多一篇（FR-011）。替换生成时 `status='replaced'` 并整体替换条目。

## RunReport — 一次运行的汇总（表 `runs`，对应 FR-015）

| 字段 | 类型 | 说明 |
|---|---|---|
| `run_id` | VARCHAR(64) PK | |
| `kind` | VARCHAR(16) | `manual`（作者本地调度器经 `POST /api/digests` 触发，生产环境的正常值）/ `regenerate` / `daily`（后端调度器触发，本地与测试兜底）/ `sync` / `collection`（`CHECK` 限定五值） |
| `started_at` / `finished_at` | VARCHAR(32) | |
| `site_results` | TEXT | JSON 字符串，每站：`{site_id, status: ok/failed, collected, error}` |
| `dropped` | TEXT | JSON 字符串，被剔除条目：`{url, title, reason}` |
| `outcome` | VARCHAR(32) NULL | `created` / `skipped_existing` / `failed` |

`--dry-run` 也只写一行 `runs`（用于追踪失败原因），不写 `digests`、`picked_items`、`articles`，也不落盘。

## Article — 对外文章（既有博客内容 + 资讯博客，表 `articles`）

沿用 `002-blog-discovery` 的 `Article` / `Tag` / `Heading` / `HistoryEntry` / `AboutProfile` 语义，导入后端数据库后提供同一套读取接口。资讯博客作为 `Article` 写入时：

- `slug`: `daily-2026-10-18`（与 `digests.slug` 相同）
- `published_on`: 当天日期
- `digest_date`: 生成列 `VARCHAR(10) AS (IF(kind = 'digest', published_on, NULL)) STORED`，唯一键 `articles_digest_date`
- `kind`: `digest`（手写文章为 `post`，`CHECK` 限定两值）
- `tags`: 必含 `资讯`（存于 `article_tags`），另加来源站点相关标签（可选）
- `summary`: 首条资讯的摘要或固定文案「今日热门前十：……」
- `body`: 由 `PickedItem` 渲染的 Markdown（排名、标题、来源、摘要、推荐理由、链接）
- `updated_at`: 每次写入刷新

**统一文章链路（澄清 Q4 = A）**: 资讯博客与手写文章共用 `GET /api/posts`、`GET /api/posts/{slug}`、归档、标签、搜索与详情页渲染；`GET /api/digests/{date}` 只提供该文章的结构化条目（排名、来源、链接等），是附加数据而非正文来源。

## 不变量

1. 同一天最多一篇 `DailyDigest`（`digests.digest_date` 主键），且最多一篇 `kind='digest'` 的 `Article`（唯一键 `articles_digest_date`，由生成列保证）。
2. `PickedItem.rank_no` 在一篇 digest 内从 1 连续且唯一，`rank_no` 越小越热。
3. 入选条目必须通过链接校验且摘要与推荐理由非空（FR-007/FR-010）。
4. 任何条目不得来自 `enabled=0` 的站点或未在清单中的站点。
5. 0 条入选时不写 `digests`、`picked_items`、`articles` 与 Markdown 文件，`POST /api/digests` 返回 `422 insufficient_content`，失败原因记入 `runs.site_results`（澄清 Q3 = A）。
