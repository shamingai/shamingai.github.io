# Research: 每日热门前十资讯博客

**Feature**: `003-daily-top10-news` | **Date**: 2026-10-18

每个决策都对照 `blog/specs/001-gitee-blog` 与 `002-blog-discovery` 已确定的方向，以及本次新增约束「前后端分离、后端单独部署」。2026-10-18 的澄清会议（spec 的 `## Clarifications`）已确定触发方式、发布链路、不足十条的处理与正文渲染方式，下文相应条目按澄清结果改写。

## D1. 后端运行时

**Decision**: 后端正本放在 `~/jekyll/shamingai.github.io.server`（与本站并列的独立目录/仓库），使用 Node.js 22 + Fastify 5（`fastify ^5.12.7`，另加 `@fastify/cors ^11.3.1`、`cheerio ^1.2.0`），与 `blog/generator`、`blog/app` 共用一套 Node 工具链和 `node --test`/`vitest` 测试方式。

**Rationale**: 仓库现有的可运行代码全部是 Node（生成器、Vue 前端），没有 Java 工具链、构建脚本或源码残留。`backend/data` 里只有一份旧的 H2 文件，没有任何 Java 源码。用 Node 可以让采集解析、内容生成、HTTP 服务共用一个进程与语言，部署只需要一个 Node 进程加一个数据目录。Fastify 5 + `@fastify/cors` 11 是当前稳定的搭配；`cheerio` 只用于解析热榜 HTML。

**Alternatives rejected**:
- Java 21 / Spring Boot：`002` 的 plan 中曾写 Java，但仓库里没有对应源码或构建文件，无法验证；引入新语言也违反「不新增不必要依赖」。
- 继续用静态生成器：不满足「后端单独部署」与「由后端生成每日资讯」。

## D2. 存储

**Decision**（已按作者决定修订）: MySQL，两套连接信息按 `DB_PROFILE` 切换——`test` 连本地 MySQL，`prod` 连 `116.62.78.39`；配置放后端仓库根目录的 `.env.test` / `.env.prod`，由作者填写、不进仓库。驱动用 `mysql2`（`^3.24.6`，纯 JS，无需原生编译）。迁移脚本放在 server 目录的 `migrations/`，`npm run migrate` 执行；所选环境的主机或账号为空时回退到 `DB_PATH` 指向的 `node:sqlite` 单文件（默认 server 目录的 `var/blog.db`，被 Git 忽略），只用于离线试跑。

**Rationale**: 作者要求后端单独部署，数据库放在固定服务器（`116.62.78.39`）上，MySQL 与现有运维环境一致；本地与线上用两套配置隔离，避免测试数据写进生产库。回退路径让没有 MySQL 的环境也能跑测试与预览。

**Superseded**: 最初选的是 SQLite，理由是数据量小、无原生依赖、备份只需一个文件；改为 MySQL 后这一优势让位于「数据库集中在一台服务器、本地与生产明确隔离」。两条路径的 SQL 方言差异（生成列、`TEXT` 长度、单行 upsert 的冲突语义）由 `src/db.js` 统一转换，但单行 upsert 在 SQLite 回退下与 MySQL 不完全等价。

## D3. 后端单独部署时的内容来源

**Decision**: 后端通过 `SITE_REPO_DIR` 指向本站仓库的本地检出，从中读取 `blog/content/`（文章 Markdown 与 `site.json`），导入为数据库中的文章；资讯博客写入该检出中的 `blog/content/posts/daily-YYYY-MM-DD.md` 并同时入库。server 自身不保存博客正文的另一份副本。拉取与导入支持定时轮询仓库（默认 10 分钟）和手动 `POST /api/content-syncs`。

**发布链路（澄清 Q2 = A）**: 后端只写文件与数据库，**不执行 `git commit`/`git push`**；作者看过生成结果后手动提交并推送（FR-016）。因此读者看到的正文来自 server 的 `GET /api/posts/{slug}`，而 GitHub 上的 Markdown 历史取决于作者是否推送。

**同日唯一**: `digests.date` 为主键，`articles.digest_date` 上有唯一索引（`articles_digest_date`），两层都保证同一天最多一篇。

**Rationale**: 保留「作者用 Git 写文章」的现有习惯；后端成为唯一读接口后，必须有受控路径把仓库内容导入。资讯博客也落盘成 Markdown，保证 Git 里有完整历史、可以人工修改，同时让作者在发布会前有一次人工把关。

**Alternatives rejected**: 后端直接读 Gitee 实时接口——需要每次请求都访问外网，且接口失败会让读者页面同时失败；后端自动推送——生成质量未经人工确认就公开，且需要在 server 进程里持有一个可写远端凭证。

## D4. 站点清单与热榜采集

**Decision**: 站点清单在数据库 `source_sites` 表中由作者维护（通过 API 或直接编辑），每个站点保存显示名称、站点地址、热榜入口 URL、解析规则键（`adapter`）、权重、单站候选上限与启用状态。解析器为每个热榜入口写一个可测试的适配器（`server/src/sources/<adapter>.js`），统一输出「链接、原题、站内排名、片段」。采集由 `services/collect.js` 按站点并发执行（`COLLECT_CONCURRENCY`，默认 3），单站超时 `COLLECT_TIMEOUT_MS`（默认 15s），失败按 `COLLECT_RETRIES`（默认 1）重试后记为 `failed`，不影响其他站点（FR-004）。

**Rationale**: 站点结构单一且会变化，规则键让「改版」只需要新增/更新一个适配器；清单可运行时增删，不需要改代码重新部署。

**Alternatives rejected**: 通用自动抓取——对反爬和不同页面结构的鲁棒性差，且难以测试。

首批站点（`migrate` 写入，作者确认后再定稿）：百度热搜、微博热搜、知乎热榜、头条热榜、少数派热门，均以公开热榜页为入口。

## D5. 内容整理（摘要与推荐理由）

**Decision**: 由后端内置的「整理器」接口完成，默认实现调用作者配置的 OpenAI 兼容接口，环境变量为 `LLM_BASE_URL`、`LLM_MODEL`、`LLM_API_KEY`、`LLM_TIMEOUT_MS`（默认 120s）；输入是原题 + 原文片段，强制 JSON 输出（标题、摘要 ≤200 字、推荐理由 ≤100 字）。响应未通过校验（超长、空、与标题无关、JSON 不合法）的条目视为「无法可靠生成」并剔除，由下一名补位（FR-008）。测试时注入假整理器，不访问外网。

**Rationale**: 与 spec 澄清一致，不引入付费资讯 API；把 LLM 作为可替换实现，测试时注入假实现即可覆盖剔除去重逻辑。

**Alternatives rejected**: 纯抽取式摘要——推荐理由需要理由链条，抽取式写不出来；调用第三方摘要服务——违反不新增付费服务。

## D6. 去重与排名

**Decision**: 对原文链接做规范化（去追踪参数、去 fragment、统一小写主机名）后精确去重；标题做归一化（去标点空格、全半角统一）后再比较。热度分 = Σ(1 / 站点排名) × 站点权重，站点权重在清单中维护（默认 1）。同分时按「被提及站点数多」优先，再按发布时间新。排序与补位逻辑在 `services/rank.js`，并列规则在 `services/order.js`。

**Rationale**: 简单、确定性、可写成单元测试；不追求跨站统一口径（spec Assumptions 已说明）。

## D7. 触发方式、执行与幂等

**Decision（澄清 Q1 = C）**:

- **生产触发**: 由作者本地保留的定时调度器每天 08:00（Asia/Shanghai）调用受鉴权的 `POST https://api.zhaotong.fun/api/digests`；请求头 `Authorization: Bearer $API_TOKEN`。
- **后端自身调度器**: `scheduler.js` 仍保留，用于本地与测试环境兜底；生产环境设 `SCHEDULER=off`，后端不自行发起生成。`POST /api/digests` 发起的运行，`runs.kind` 记为 `manual`；带 `regenerate: true` 时记为 `regenerate`；后端调度器发起时记为 `daily`。
- **幂等**: 以 `(date)` 唯一约束保证同日最多一篇；当天已有且未要求重生成时返回 `409 duplicate_date`，带 `{"regenerate": true}` 时整体替换并返回 `200`（`status: replaced`）。
- **可观测**: 每次运行写入 `runs` 表，`GET /api/runs/{run_id}` 查看每站结果与被剔除条目（FR-015）。

**Rationale**: 把「何时生成」与「在哪台机器上生成」解耦：生产服务器不需要开放对外的出站调度配置，作者本地的调度器只需一个 `curl`，失败时作者能第一时间看到。唯一约束是数据库层兜底，防止触发的重试与手动触发同时产生两篇。

**Alternatives rejected**: 后端调度器作为唯一触发——服务器时区/休眠/重启会让「每天一次」不可靠，且作者难以在本机确认当天是否已生成。

## D8. 前端对接

**Decision**: 前端构建时通过 `VITE_API_BASE_URL` 指向后端；正式构建写 `https://api.zhaotong.fun`（`blog/app/.env.production`）。后端用 `@fastify/cors` 只放行 `CORS_ORIGINS` 列出的站点，默认值 `https://blog.zhaotong.fun`。前端统一经 `blog/app/src/services/api.js` 请求，页面展示加载中 / 加载失败（重试）/ 空结果三种状态。本地开发默认走 Vite 的 `/api` 代理，不需要 CORS；需要验证跨域时用 `npm run dev:api` 直连。

**Rationale**: 对应宪法 IV（前后端只经 HTTP/JSON 契约交互）与 spec 澄清「后端不可用时显示错误而非空列表」。

## D9. 部署形态

**Decision**: server 目录整体作为部署单元（独立 Git 仓库、独立 `npm install`/`npm test`），以单进程运行：

- systemd 单元 `deploy/shamingai-server.service`（`npm run start`），进程只监听 `127.0.0.1:8787`（`HOST=127.0.0.1`、`PORT=8787`），数据库连 `116.62.78.39`（`DB_PROFILE=prod`，账号在 `.env.prod`），`SITE_REPO_DIR` 指向可写的本站仓库检出，`SCHEDULER=off`。
- Nginx 反代 `https://api.zhaotong.fun`（`deploy/nginx.conf`）：`location /api/` → `http://127.0.0.1:8787`，透传 `X-Forwarded-*`，`proxy_read_timeout` 600s（生成接口同步调用 LLM 与链接检查），`client_max_body_size 256k`；不变更 CORS 响应头（由后端生成）；`/health` 与 `/` 返回 404，健康检查统一走 `GET /api/health`（DB 正常 `200`，异常 `503`）。
- 前端 `vite build` 产物由 GitHub Pages 提供，域名 `https://blog.zhaotong.fun`。

**Rationale**: 单独部署的最小可行形态：一个 Node 进程 + 一个数据目录 + 一段 Nginx 反代；后端不直接对外监听端口，TLS 与限流集中在 Nginx。

**Alternatives rejected**: 直接暴露 8787 并让前端跨域直连——管理接口与生成接口会直接面向公网，TLS 与访问控制都要在 Node 里再实现一遍。
