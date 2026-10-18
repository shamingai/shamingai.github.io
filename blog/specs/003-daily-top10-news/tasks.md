---

description: "每日热门前十资讯博客的任务分解"
---

# Tasks: 每日热门前十资讯博客

**Input**: 设计文档位于 `/Users/zhaotong/jekyll/shamingai.github.io/blog/specs/003-daily-top10-news/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/http-api.md、quickstart.md

**Tests**: 保留测试任务。原因是项目宪法原则 II 要求测试覆盖率不低于 80%，测试不是可选项。计划中列出的每个测试任务只要该功能存在就必须执行。

**Organization**: 任务按用户故事分组，每个故事都能单独实现与单独验证。路径约定：

- 后端仓库：`~/jekyll/shamingai.github.io.server`，下文路径均相对于它（缩写为 `server/`）。
- 前端与内容仓库：`~/jekyll/shamingai.github.io`，下文路径均相对于它（缩写为 `site/`）。

**现状说明**：`server/` 与 `site/blog/app/` 中的骨架代码已存在（路由、服务、迁移、单元/契约测试都能跑通），但没有任何 CI、没有集成测试、真实站点适配器未经真实抓取验证、部署配置未在目标机器上跑过。因此任务分两类：**核对与补强**（标记为“核对”“补齐”）和**从零实现**（标记为“实现”）。已经达标的条目核对后直接勾选。

**已按作者决定改定的三处**：`generate --dry-run` 只预览——不写 `digests`/`picked_items`/`articles`、不写文件，只留一行 `runs` 记录（T029）；`rejections`、`candidates` 两张表已删除（T007）；数据库改为 MySQL，按 `DB_PROFILE` 在本地 test 库与 `116.62.78.39` 的 prod 库之间切换（T067、T068）。

---

## Phase 1: Setup（共享基础设施）

**Purpose**: 让两个仓库具备可重复安装、可本机运行的环境。

- [x] T001 核对 Node 版本满足 `engines.node: >=22.5`（`node:sqlite` 回退与测试依赖），在本机执行 `node -v`（v22.14.0）并把结论写入 `server/README.md` 的环境要求小节；目标服务器待部署时补录
- [ ] T002 [P] 在 `server/` 执行 `npm ci` 并核对 `package-lock.json` 与 `package.json` 一致（fastify 5、@fastify/cors 11、cheerio 1、mysql2 3），不一致时重新生成锁文件
- [ ] T003 [P] 校对 `server/.env.example`：`DB_PROFILE=test`，`MYSQL_TEST_*` / `MYSQL_PROD_*` 两组连接信息分离（prod 默认 `116.62.78.39`，数据库名 `prod`），真实账号密码放 `.env.test` / `.env.prod` 且不进仓库；生产示例 `SCHEDULER=off`，并补充注释“生产由作者本地调度器调用 `POST /api/digests` 触发；打开 SCHEDULER 只用于服务器自测”；核对 `CORS_ORIGINS`、`SITE_REPO_DIR`、`DB_PATH`、`API_TOKEN` 的说明与 `server/src/config.js` 一致
- [ ] T004 [P] 在 `site/blog/app` 执行 `npm ci`，核对 `.env.production`（`VITE_API_BASE_URL=https://api.zhaotong.fun`）与 `.env.dev.example`（`http://localhost:8787`）两个文件内容正确
- [x] T005 [P] 核对 `site/blog/app/vite.config.js` 的 `server.proxy` 已把 `/api` 代理到 `http://127.0.0.1:8787`，`npm run dev` 与 `npm run dev:api` 联调不涉及跨域
- [x] T006 [P] 校验 `server/.gitignore` 覆盖 `node_modules/`、`var/`、`.env`、`.env.*`（保留 `.env.example`）、`*.log`、`.DS_Store`；在 `server/` 执行 `git status --short` 确认没有数据库或密钥文件被跟踪

---

## Phase 2: Foundational（所有用户故事的前置条件）

**Purpose**: 后端的数据结构、配置、HTTP 外壳与来源站点注册表。任何一个用户故事都依赖这一阶段。

**⚠️ CRITICAL**: 本阶段未完成时，任何用户故事都无法开始。

- [x] T007 核对 `server/migrations/001_init.sql` 的表与约束与 `data-model.md` 一致（MySQL 方言）：`articles.kind in ('post','digest')`、生成列 `articles.digest_date` + 唯一键 `articles_digest_date`、`digests.digest_date` 主键、`picked_items` 的 `(digest_date,rank_no)` 主键与 `picked_items_url (digest_date,url_key)` 唯一键、`runs.kind` 枚举；确认 `rejections`、`candidates` 两张表已删除，采集候选只存在于内存与 `runs.site_results`
- [ ] T008 核对 `server/src/db.js`：`test`/`prod` 两套 MySQL 连接由 `mysql2` 连接池建立，`migrate` 按文件名顺序只执行一次；所选环境主机或账号为空时回退 `node:sqlite`（`toSqliteStatements` 把 `UNIQUE KEY` 改成唯一索引、生成列降级为普通列 + 触发器），回退时 `PRAGMA foreign_keys` 生效；单行 upsert 在 SQLite 下被改写成 `INSERT OR REPLACE`，凡是“冲突保留旧行”的场合改用 `INSERT … SELECT … WHERE NOT EXISTS`；用例在 `server/tests/unit/db.test.js`
- [x] T009 在 `server/tests/unit/config.test.js` 新增用例，覆盖 `loadConfig`：默认值（端口 8787、监听 127.0.0.1、`Asia/Shanghai`、`digestSize 10`、`COLLECT_CONCURRENCY=3`/`RETRIES=1`/`TIMEOUT_MS=15000`、`LINK_CHECK_TIMEOUT_MS=8000`）、`SCHEDULER=off` 关闭调度器、`CORS_ORIGINS` 逗号分隔、`~` 路径展开
- [ ] T010 核对 `server/src/errors.js` 与 `server/src/app.js`：所有错误统一为 `{"error":{"code","message","details?}}`，404 走 `not_found`，500 不泄露堆栈；已有断言在 `server/tests/contract/api.test.js`
- [ ] T011 核对 `server/src/app.js` 的 CORS 白名单：无 Origin 放行、白名单内的 `https://blog.zhaotong.fun` 与本地 `http://localhost:5173` 放行、其他来源不返回 `access-control-allow-origin`
- [ ] T012 核对 `server/src/server.js`：启动时自动 `migrate` + `seedSites`，`SCHEDULER=off` 时不启动定时器，收到 SIGTERM 时关闭 Fastify 与数据库连接池；在 `server/tests/contract/api.test.js` 补充“SCHEDULER=off 起服务不报错”的用例（如尚未覆盖）
- [x] T013 核对 `server/src/routes/reader.js` 的 `GET /api/health`：返回 `{status, db, content_dir, last_sync_at, details}`；内容目录未配置时 `status=degraded`、`content_dir=unconfigured`、HTTP 503，配置且可写时 `ok`；并确认 `server/deploy/nginx.conf` 的 `/health` 404 规则不会误伤 `/api/health`
- [ ] T014 核对 `server/src/routes/admin.js` 的 `onRequest` 令牌钩子：未配置 `API_TOKEN` 时写接口返回 503 `admin_disabled`，令牌错误返回 401 `unauthorized`，`GET /api/source-sites` 保持公开；用例位于 `server/tests/contract/api.test.js`
- [x] T015 核对 `server/src/sources/index.js` 的 `adapters` 注册表、`adapterKeys`、`adapterOf` 与 `seedSites`（逐行 `INSERT … SELECT … WHERE NOT EXISTS`，重复 migrate 不重复插入、不覆盖人工调整；用例 “seedSites leaves existing rows alone when run twice”），并把默认站点清单与 `spec.md` 的“首批为中国大陆可访问的综合门户、科技媒体和社区热点榜”对齐（当前 5 个：百度热搜、微博热搜、知乎热榜、头条热榜、少数派热门）
- [ ] T016 [P] 在 `server/README.md` 的“目录”一节补上 `tests/contract`、`tests/integration`、`deploy/nginx.conf` 的说明，使其与磁盘实际结构一致
- [ ] T067 补一段迁移说明：MySQL 8 的 `DEFAULT` 表达式、生成列与 `TEXT` 列长度限制在 SQLite 回退下语义不同（如 `LEFT(url,700)` 生成列降级、`TEXT` 无长度上限），新增列或索引前先在 `server/tests/unit/db.test.js` 用内存 SQLite 跑一遍；`rejections`、`candidates` 已删除，若线上旧库仍存在这两张表，由作者手动 `DROP TABLE`（迁移脚本不自动删表）
- [ ] T068 在两个环境各跑一次 `DB_PROFILE=test npm run migrate` 与（部署机上）`DB_PROFILE=prod npm run migrate`，核对输出为 `数据库：test/mysql` / `数据库：prod/mysql`、首次播种 5 个站点、第二次（无新增）与 0；连错库时以 `MYSQL_*_HOST`、`*_DATABASE` 双确认，避免把测试数据写进 `116.62.78.39`

**Checkpoint**: 后端能 `npm run migrate && npm start` 起服务，`curl http://127.0.0.1:8787/api/health` 返回 `ok`，管理接口按令牌行为正确。

---

## Phase 3: User Story 1 - 每天得到一篇当天的前十资讯博客（Priority: P1）🎯 MVP

**Goal**: 通过受鉴权的 `POST /api/digests` 触发一次生成，得到当天日期、最多 10 条、每条含标题/摘要/推荐理由/链接、带「资讯」标签的博客，同时写入站点内容目录与数据库。

**Independent Test**: 用固定采集数据与假 LLM 调用 `POST /api/digests`，断言 201、`date` 为当天、`item_count` 在 1～10 之间、`markdown_path` 指向 `blog/content/posts/daily-<日期>.md`，文件内容含「资讯」与 10 个 `## N.` 小节，数据库 `articles` 中 `kind='digest'` 且 `article_tags` 含「资讯」。

### Tests for User Story 1 ⚠️

- [ ] T017 [P] [US1] 核对 `server/tests/unit/rank.test.js` 覆盖：URL 归一化（去 utm 与尾斜杠）、标题相似去重（阈值）、跨站合并累加 `mention_count`、按 `site_rank` 与站点 `weight` 排序；缺哪条补哪条
- [ ] T018 [P] [US1] 核对 `server/tests/unit/llm.test.js` 覆盖：`buildMessages` 提示词包含原题与原链接、`parseJsonContent` 处理代码围栏、`validateEdit` 剔除空摘要/超长/缺字段、超长截断到 200 字摘要与 100 字推荐理由
- [ ] T019 [P] [US1] 核对 `server/tests/unit/render.test.js` 覆盖：标题含日期、每条的 `## N. 标题`、来源站与站内排名、原文链接、`note` 渲染在正文开头、末尾无多余空行
- [ ] T020 [P] [US1] 扩充 `server/tests/contract/api.test.js`：注入假 `generateDigest`，断言 `POST /api/digests` 新生成返回 201 与 `run_id/date/slug/item_count/note/status/markdown_path/site_results/dropped`，`regenerate:true` 返回 200，非法 `date` 返回 400 `invalid_date`，默认日期取上海时区当天

### Implementation for User Story 1

- [ ] T021 [US1] 核对 `server/src/services/collect.js`：并发按 `COLLECT_CONCURRENCY`、失败重试按 `COLLECT_RETRIES`、超时按 `COLLECT_TIMEOUT_MS`、单站失败记录原因且不影响其他站、结果顺序稳定；对应用例 `server/tests/unit/collect.test.js`
- [ ] T022 [US1] 核对 `server/src/llm/client.js`：OpenAI 兼容 `chat/completions`、`LLM_TIMEOUT_MS`、非法 JSON 或字段缺失时抛错（由编排层剔除该条）
- [ ] T023 [US1] 核对 `server/src/llm/prompt.js`：提示词明确“只依据给定标题与摘要，不编造事实，输出 JSON `{title, summary, reason}`”
- [ ] T024 [US1] 核对 `server/src/services/digest.js` 的编排顺序：同日已存在且未 `regenerate` → 409 `duplicate_date`；无启用站点或无可用候选 → 422 `insufficient_content`；未配置 LLM → 503 `llm_not_configured`；1～9 条 → 照常生成并写 `note`；`regenerate` → 覆盖并返回 `status: "replaced"`
- [ ] T025 [US1] 核对 `server/src/services/render.js` 与 `digestFile`：写入 `<SITE_REPO_DIR>/blog/content/posts/daily-YYYY-MM-DD.md`，`date:` 指令头、`category: 资讯`、正文每段结构稳定
- [ ] T026 [US1] 核对 `server/src/services/digest.js` 的 `upsertDigestArticle`：同步写 `articles`（`kind='digest'`、`published_on=date`、`summary_generated=1`）、`article_tags`（「资讯」）、`headings`，重生成时先删后写
- [ ] T027 [US1] 在 `server/tests/unit/digest.test.js` 补一条用例：1 条入选时仍生成成功、`note` 非空且 Markdown 开头出现该说明
- [ ] T028 [US1] 核对 `server/src/routes/admin.js` 的 `POST /api/digests` 与 `GET /api/runs/:runId`：运行记录含 `outcome`（`created`/`replaced`/`skipped_existing`/`failed`）、`site_results`、`dropped`；未知 run 返回 404 `run_not_found`
- [x] T029 [US1] 核对 `server/src/cli.js` 的 `generate` 命令为管理接口的等价入口，错误时退出码为 1 并打印 `run_id`，供本地 crontab 兜底使用，并在 `server/README.md` 写明这一用法。`--dry-run` 为纯预览：照常采集、入选与渲染，但只写一行 `runs`（`outcome='dry_run'`、`site_results`、`dropped`），不写 `digests`/`picked_items`/`articles`、不写 Markdown 文件，预览正文打到 stdout、提示打到 stderr；未配置 LLM（`LLM_BASE_URL`/`LLM_MODEL`）时仍以 `llm_not_configured` 失败退出，不预览

**Checkpoint**: 用假采集与假 LLM，一条命令即可产出当天博客，文件与数据库内容一致。

---

## Phase 4: User Story 2 - 条目可追溯、可复核（Priority: P2）

**Goal**: 每条入选资讯都有可打开的原文链接、来源站与站内排名；不可用条目被剔除并由下一名次补位，剔除原因可见。

**Independent Test**: 构造 12 条候选，其中 2 条链接 404、1 条摘要无法生成，触发生成后断言最终 10 条全部可访问、无重复、补位来自后续名次，`dropped` 中能看到被剔除条目的 URL 与原因。

### Tests for User Story 2 ⚠️

- [ ] T030 [P] [US2] 在 `server/tests/unit/link-check.test.js` 新增用例：200 视为可达、404 不可达、HEAD 405/403 时回退 GET、超时记为“链接超时”、并发顺序与输入一致
- [ ] T031 [P] [US2] 扩充 `server/tests/unit/digest.test.js`：链接不可达的条目被剔除并用下一名次补位（已有类似断言时补齐 `dropped.reason` 的断言）、最终条目不重复、剔除原因写入 `runs.dropped`
- [ ] T032 [P] [US2] 在 `server/tests/contract/api.test.js` 补 `GET /api/digests/:date` 的断言：`items` 按 `rank` 升序、每项含 `title/url/site_id/site_name/site_rank/summary/reason`，未知日期返回 404

### Implementation for User Story 2

- [ ] T033 [US2] 核对 `server/src/services/link-check.js`：`HEAD` 优先、`403/405/501` 回退 `GET`、超时与网络错误返回 `{ok:false, reason}`，禁止绕过登录与付费墙
- [ ] T034 [US2] 核对 `server/src/services/digest.js` 的补位循环：按 `digestSize` 分批取候选，校验失败的继续从后续名次补齐，直到凑满或候选耗尽
- [ ] T035 [US2] 核对 `server/src/services/rank.js` 的去重规则：同一归一化 URL 只保留热度更高的来源，标题相似度超过阈值的只留一条，被剔除的一方记入 `dropped`
- [ ] T036 [US2] 核对 `server/src/services/article.js` 的 `getDigest`：从 `picked_items` 读出 `site_name`、`site_rank`、`mention_count` 并按 `rank` 排序，供前端展示来源与排名
- [ ] T037 [US2] 核对 `server/src/services/render.js` 的 `- 来源：<站点> 第 <排名> 名` 行：`siteRank` 缺失时退化为“来源：<站点>”，不出现 `第 null 名`

**Checkpoint**: 生成结果可供作者逐条核对，任何被剔除的条目都能在运行报告中找到原因。

---

## Phase 5: User Story 3 - 在网站上阅读当天的资讯（Priority: P3）

**Goal**: 读者在首页看到当天资讯博客、带「资讯」标签，进入正文与手写文章同样渲染，标签页按日期倒序，搜索能命中。

**Independent Test**: 后端返回固定数据时，前端测试断言首页出现该博客与「资讯」标签、`DigestPage` 渲染条目与 `note`、标签页只列资讯博客且日期倒序、搜索命中；接口失败时页面显示错误提示与重试按钮。

### Tests for User Story 3 ⚠️

- [ ] T038 [P] [US3] 核对 `site/blog/app/tests/home-page.test.js`：首页取 `api.posts` 最新文章、资讯博客出现在列表中并显示「资讯」标签
- [ ] T039 [P] [US3] 核对 `site/blog/app/tests/digest-and-paging.test.js`：`DigestPage` 渲染条目顺序、`note` 面板、加载失败提示与重试
- [ ] T040 [P] [US3] 核对 `site/blog/app/tests/article-page.test.js`：`ArticlePage` 对 `kind=digest` 与普通文章使用同一渲染链路，失败提示一致
- [ ] T041 [P] [US3] 在 `site/blog/app/tests/tag-page.test.js` 补充：「资讯」标签页按日期从新到旧排列、只显示资讯博客

### Implementation for User Story 3

- [ ] T042 [US3] 核对 `site/blog/app/src/services/api.js`：`BASE_URL` 取自 `VITE_API_BASE_URL`、`PAGE_SIZE=10`、网络失败抛 `ApiError("无法连接服务器", 0)`、非 2xx 透出后端 `error.message`，方法覆盖 `posts/post/archive/categories/categoryPosts/tags/tagPosts/search/about/history/digests/digest`
- [ ] T043 [US3] 核对 `site/blog/app/src/services/useResource.js` 与 `paging.js`：统一 `loading/error/data/reload` 状态，失败时不把空列表当作“没有文章”
- [ ] T044 [US3] 核对首页 `site/blog/app/src/pages/HomePage.vue`、归档 `ArchivePage.vue`、分类 `CategoryPage.vue`、标签 `TagPage.vue`、搜索 `SearchPage.vue` 都只经 `api` 取数，且已无对 `site-data.json` 或已删除的 `services/site.js` 的引用（`grep -rn "site-data\|services/site" site/blog/app/src` 应无结果）
- [ ] T045 [US3] 核对 `site/blog/app/src/pages/DigestPage.vue`：正文来自 `api.digest(date)` 的条目与 `api.post(slug)` 的 Markdown，`note` 用 `.panel` 展示
- [ ] T046 [US3] 核对 `site/blog/app/src/pages/DigestsPage.vue`：列出全部资讯博客，按日期倒序分页
- [ ] T047 [US3] 在 `site/blog/app/.env.dev.example` 与本地实测中验证：后端以 `CORS_ORIGINS=https://blog.zhaotong.fun,http://localhost:5173` 启动时，前端直连 `http://localhost:8787` 能取到数据

**Checkpoint**: 结合作者手动 `git push` 后的站点构建，线上首页、正文、标签、搜索都能看到资讯博客。

---

## Phase 6: User Story 4 - 调整生成规则与站点清单（Priority: P4）

**Goal**: 作者可增删站点、调整每站保留候选数与启用状态；单站失败不影响其他站；全部无内容时不生成空博客并说明原因。

**Independent Test**: 通过管理接口删除一个站点、新增一个指向测试适配器的站点，执行生成，断言结果只来自新清单；把唯一站点指向不可访问地址，断言 422 `insufficient_content` 且运行报告列出失败原因，且没有新的 Markdown 文件。

### Tests for User Story 4 ⚠️

- [ ] T048 [P] [US4] 核对 `server/tests/contract/api.test.js` 的 `POST/PATCH/DELETE /api/source-sites` 生命周期用例：201、409 `site_exists`、400 `invalid_site`、400 `invalid_adapter`（附可用适配器列表）、`{"enabled":false}` 后不再参与采集、204 删除
- [ ] T049 [P] [US4] 在 `server/tests/unit/digest.test.js` 补用例：所有站点采集失败 → 422 `insufficient_content`，`details.site_results` 含每站原因，且 `digests` 与内容目录都没有新增文件

### Implementation for User Story 4

- [ ] T050 [US4] 核对 `server/src/services/collect.js` 的 `enabledSites`：只取 `enabled = 1`，按 `id` 稳定排序，`max_candidates` 生效
- [ ] T051 [US4] 核对 `server/src/routes/admin.js` 的 `writeSite` 校验：`id` 规则、`name` 非空、`home_url`/`hot_list_url` 必须是 http(s)、`weight` 非负、`max_candidates` 为 1～100 的整数
- [ ] T052 [US4] 核对 `server/src/app.js` 中 `POST /api/content-syncs` 的后台同步：返回 202 `{run_id}`，结果写入 `runs.kind='sync'`，作者增删站点后可用它确认读接口数据
- [ ] T053 [US4] 在 `server/README.md` 的接口表下补一段“增删站点示例”，给出 `curl -X POST/PATCH/DELETE` 三条带 `Authorization: Bearer $API_TOKEN` 的完整命令

**Checkpoint**: 站点清单完全由接口管理，作者的调整能在下一次生成中生效。

---

## Phase 7: Polish 与跨故事事项

**Purpose**: 补齐计划中标为“未完成/未验证”的部分：CI 覆盖率门槛、端到端集成测试、真实适配器验证、部署验证。

- [ ] T054 新增 `.github/workflows/ci.yml`（位于 `server/` 仓库根）：Node 22，`npm ci` → `npm test` → `npm run coverage`，从覆盖率输出解析 `all files` 的 `line %`，低于 80 时 `exit 1`；同时另跑一步 `node --check src/**/*.js`（逐个文件校验语法，不能只靠 `npm test`，测试覆盖不到的文件不会被加载）
- [ ] T055 [P] 在 `site/blog/app/.github/workflows/ci.yml` 新增前端工作流：Node 22，`npm ci` → `npm test` → `npm run build`
- [ ] T056 [P] 在 `server/tests/integration/generate.test.js` 新增端到端用例：临时目录作 `SITE_REPO_DIR`、内存 SQLite（或指向临时 `DB_PATH` 的一次性 SQLite 文件）、注入假 collect 与假 LLM、真实 `fetch` 打到一个本地 `http.createServer` 充当原文站点，验证请求→落盘→入库→读接口`GET /api/digests/:date` 全链路
- [ ] T057 [P] 在 `server/tests/integration/cross-day.test.js` 新增用例：上海时区跨日边界（UTC 15:59 与 16:00）决定的“当天”正确；同日第二次生成返回 409；`regenerate` 替换 Markdown 且 `digests` 仍只有一行
- [ ] T058 [P] 为 `server/src/sources/cn.js` 的三个适配器补离线 fixture 测试：`server/tests/fixtures/weibo-hot.json`、`zhihu-hot.json`、`toutiao-hot.json`，在 `server/tests/unit/sources.test.js` 断言解析字段、剔除广告词与置顶词、URL 改写为 `www.zhihu.com/question/...`
- [ ] T059 [P] 为 `server/src/sources/generic.js` 的 `baidu-board` 补离线 fixture 测试（`server/tests/fixtures/baidu-board.html`），断言标题、链接、热度描述提取正确
- [ ] T060 写一个不进自动测试的冒烟脚本 `server/scripts/smoke-sources.js`（`node --no-warnings` 直接运行）：依次 `collectSite` 每个默认站点并打印 `status/collected/error`，用于在作者本机确认真实站点当前是否可解析；结果记录到 `server/README.md` 的“站点现状”表
- [ ] T061 [P] 在本机用临时前缀验证 `server/deploy/nginx.conf`：`nginx -t -p <临时前缀> -c <临时前缀>/nginx.conf`，`location /api/` 指向 `127.0.0.1:8787`、`/health` 与 `/` 返回 404、`proxy_read_timeout 600s`；**不得**修改或重启作者本机正在运行的 nginx
- [ ] T062 [P] 校对 `server/deploy/shamingai-server.service`：`User=blog`、`WorkingDirectory=/srv/shamingai.github.io.server`、`EnvironmentFile`、`StateDirectory=shamingai-server`、`ReadWritePaths`；生产 `.env` 设 `DB_PROFILE=prod` 并把 `MYSQL_PROD_*` 写进后端根目录的 `.env.prod`（连接 `116.62.78.39`），同时 `SCHEDULER=off`，以上写进 `server/README.md`
- [ ] T063 [P] 校对 `server/deploy/Dockerfile` 与 Node 22 基础镜像、`npm ci --omit=dev`、非 root 用户启动 `src/cli.js serve` 一致，并在 `server/README.md` 标注“可选，生产以 systemd + nginx 为准”
- [ ] T064 [P] 更新 `site/blog/specs/003-daily-top10-news/quickstart.md` 的“上线前检查”一节：生产 `SCHEDULER=off`、作者本地 crontab 08:00 调 `POST /api/digests`、手动 `git push` 内容仓库、前端 `npm run build` 发布到 `https://blog.zhaotong.fun/`
- [ ] T065 按 `quickstart.md` 逐条走查并记录结果（本机直连 `127.0.0.1:8787`，不碰作者 nginx）：`migrate → sync → serve → curl /api/health → curl /api/posts → POST /api/digests（假 LLM）→ GET /api/digests/:date → GET /api/runs/:runId`；最后一环在本机 `$HOME/jekyll/shamingai.github.io` 配 `10 8 * * *` 的 crontab，生成后检查 `blog/content/posts/daily-*.md` 并 `git add` / `commit` / `push`（生产 `SCHEDULER=off`，服务器上不重复生成）
- [ ] T066 [P] 在 `server/README.md` 增加“已知限制”一节：真实站点可能改版或限流、LLM 依赖外部服务（未配置时 `generate` 与 `--dry-run` 都以 `llm_not_configured` 失败）、SQLite 回退只用于离线试跑且单行 upsert 语义与 MySQL 不完全等价、覆盖率门槛目前由 CI 强制
- [ ] T069 由作者在后端根目录填写 `.env.test` 与 `.env.prod`（真实用户名、密码、生产库名），`.env.example` 只保留空值占位；两个文件已被 `.gitignore` 排除，不提交

**Checkpoint**: 后端与前端都有 CI；集成测试覆盖生成主链路；作者能在本机确认站点可解析；部署步骤有据可查。

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：无依赖，可立即开始。
- **Foundational（Phase 2）**：依赖 Setup；阻塞所有用户故事。
- **User Story 1（Phase 3）**：依赖 Foundational，是 MVP。
- **User Story 2（Phase 4）**：依赖 US1 的编排主链路；可与 US3 并行。
- **User Story 3（Phase 5）**：依赖 Foundational 中的读接口；与 US2 并行。
- **User Story 4（Phase 6）**：依赖 Foundational 中的管理接口与站点表；可与 US2、US3 并行。
- **Polish（Phase 7）**：依赖至少 US1 完成；T054/T055 可更早开始。

### User Story Dependencies

- **US1（P1）**：无跨故事依赖。
- **US2（P2）**：依赖 US1 的候选→入选→落盘链路。
- **US3（P3）**：不依赖 US2，仅需后端读接口与一份资讯数据。
- **US4（P4）**：不依赖 US2/US3，只依赖 Foundational。

### Within Each User Story

- 测试先行，且必须在实现之前失败。
- 服务层先于路由层；路由层先于前端页面。
- 故事内的“核对”任务若发现实现已满足，直接勾选并记录证据（命令与输出）。

### Parallel Opportunities

- Phase 1 中 T002～T006 可并行（不同文件、不同仓库）。
- Phase 2 中 T016 与 T009～T015 可并行。
- US1 的测试任务 T017～T020 全部并行。
- US2 的 T030～T032 并行；US3 的 T038～T041 并行；US4 的 T048～T049 并行。
- Polish 中 T055～T059、T061～T064 并行。

---

## Parallel Example: User Story 1

```bash
# 并行编写四个测试文件（互不依赖）
Task: "核对 server/tests/unit/rank.test.js 的排序与去重覆盖"
Task: "核对 server/tests/unit/llm.test.js 的校验与截断覆盖"
Task: "核对 server/tests/unit/render.test.js 的 Markdown 结构覆盖"
Task: "扩充 server/tests/contract/api.test.js 的 POST /api/digests 断言"
```

## Parallel Example: User Story 3

```bash
# 前端四个页面测试并行
Task: "核对 site/blog/app/tests/home-page.test.js"
Task: "核对 site/blog/app/tests/digest-and-paging.test.js"
Task: "核对 site/blog/app/tests/article-page.test.js"
Task: "补充 site/blog/app/tests/tag-page.test.js 的资讯标签倒序"
```

---

## Implementation Strategy

### MVP First（仅 User Story 1）

1. 完成 Phase 1 Setup（T001～T006）。
2. 完成 Phase 2 Foundational（T007～T016），验证 `npm test` 与 `npm start` 正常。
3. 完成 Phase 3 US1（T017～T029）。
4. 用假采集与假 LLM 跑通一次生成，确认 Markdown 与数据库一致。
5. 到此为止就是一个可用的“每日一篇资讯博客”后端。

### Incremental Delivery

1. Setup + Foundational → 后端可运行。
2. + US1 → 能生成当天博客（可交付）。
3. + US2 → 条目可追溯（可信度提升）。
4. + US3 → 读者可读（前端上线）。
5. + US4 → 作者可维护站点清单。
6. + Polish → CI、集成测试、部署验证。

### Parallel Team Strategy

1. 全体完成 Setup 与 Foundational。
2. 之后：后端同学做 US1 → US2 → US4，前端同学做 US3，运维同学做 T054、T061～T064。

---

## Notes

- 标记 `[P]` 的任务只改不同文件，且不依赖未完成任务。
- 核对类任务必须附上验证命令与输出，不能只凭阅读判断“已经满足”。
- 真实网络相关的验证（T060、T065）不进 `npm test`，在作者本机手动执行。
- 不修改、不重启作者本机正在运行的 nginx；不自动 commit/push 任何仓库。
- 每个故事结束时都应能独立演示：US1 用 `curl`，US2 看 `dropped`，US3 打开页面，US4 增删站点。
