# Implementation Plan: 每日热门前十资讯博客

**Branch**: `003-daily-top10-news` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/blog/specs/003-daily-top10-news/spec.md`

**用户补充约束**: 设计成前后端分离，后端单独部署。后端用 Nginx 反代部署，公开域名 `https://api.zhaotong.fun`；前端正式域名 `https://blog.zhaotong.fun`。

## Summary

新增一个可单独部署的后端服务，代码放在与本站并列的独立目录 `~/jekyll/shamingai.github.io.server`（下称 server 仓库），不在本站仓库内：它从作者维护的站点清单采集热榜候选，去重、排名、校验链接，调用 OpenAI 兼容的语言模型写出摘要与推荐理由，生成当天的资讯博客（Markdown 落盘 + 入库），并以 HTTP/JSON 对外提供全部阅读数据。每日生成由作者本地保留的定时调度器（每天 08:00 Asia/Shanghai）调用受鉴权的 `POST /api/digests` 触发（FR-017），后端自身定时器在生产环境关闭，作为本地与测试环境的兜底。后端只写本站仓库的 `blog/content/posts/`，**不自动 commit/push**，推送由作者手动完成（FR-016）。前端 `blog/app/` 改为只通过该接口读取数据，不再依赖预生成的 `site-data.json`。资讯博客是一种普通文章，走与手写文章相同的正文渲染，进入首页、归档、「资讯」标签和搜索（FR-014）；`/api/digests/{date}` 的结构化条目只是该文章的附加数据。

## Technical Context

**Language/Version**: Node.js 22（后端与现有 `blog/generator`、`blog/app` 一致）

**Primary Dependencies**: 后端 Fastify 5（`^5.12.7`）+ `@fastify/cors`（`^11.3.1`）+ `cheerio`（`^1.2.0`）+ `mysql2`（`^3.24.6`）+ 全局 `fetch`；前端沿用 Vue 3.5 / Vite 6；不新增付费资讯 API；`node:sqlite` 只作数据库回退

**Storage**: MySQL，两套连接信息按 `DB_PROFILE` 切换——`test` 连本地 MySQL（`MYSQL_TEST_*`，配置放后端根目录 `.env.test`），`prod` 连部署机上的 `116.62.78.39`（`MYSQL_PROD_*`，配置放 `.env.prod`），两者都由用户本地填写、不进仓库；所选环境的主机或账号为空时回退到 `DB_PATH` 指向的 `node:sqlite` 单文件（仅离线试跑）。资讯博客 Markdown 写入本站仓库检出中的 `blog/content/posts/daily-YYYY-MM-DD.md`；导入源为本站仓库的 `blog/content/`，server 通过 `SITE_REPO_DIR` 指向本站检出的目录

**Testing**: 后端 `node --test`（单元 + Fastify `inject` 契约测试，当前 72 个用例全过；覆盖率行 89.15% / 分支 79.76% / 函数 87.36%）；前端 Vitest + Vue Test Utils（20 个用例全过）

**Target Platform**: Linux 服务器上一个 Node 进程（systemd `shamingai-server.service`），只监听 `127.0.0.1:8787`，由 Nginx 反代 `https://api.zhaotong.fun/api/`；独立于前端静态托管（GitHub Pages，`https://blog.zhaotong.fun`）

**Project Type**: 前后端分离的 Web 应用；后端为唯一数据源，前端只消费 HTTP/JSON

**Performance Goals**: `GET /api/posts`、`/api/search` 第一页 p95 < 300ms（≤1000 篇文章）；一次每日生成在 10 分钟内完成（SC-006）

**Constraints**: 不绕过登录或付费墙；同一天最多一篇博客（`articles_digest_date` 唯一索引 + `digests.date` 主键）；站点失败不得中断整次生成；后端不可用时前端必须显示错误而非空列表；管理接口必须带 `Authorization: Bearer $API_TOKEN`，未配置令牌时 503 `admin_disabled`，令牌错误 401 `unauthorized`；生产环境关闭后端自身定时器（`SCHEDULER=off`），每日生成由作者本地调度器调用 `POST /api/digests` 触发（FR-017）

**Scale/Scope**: 一位作者；≤10 个来源站点；≤1000 篇文章；每天 1 篇资讯博客

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 计划前 | 设计后 |
|---|---|---|
| I. 代码质量优先 | 通过。采集适配器、整理器、排名、渲染各自单一职责。 | 通过。适配器接口 `{ adapter, collect(ctx) -> Candidate[] }`；整理器 `{ summarize(candidate) -> {title, summary, reason} }` 可替换；生成编排集中在 `services/digest.js`。 |
| II. 测试覆盖率 ≥80% | 通过。去重、排名、剔除补位、幂等、失败隔离、API 形状全部写成自动化测试。 | 通过。`npm test` 72 例、前端 `npx vitest run` 20 例全过；`npm run coverage` 行覆盖率 89.15%（分支 79.76%、函数 87.36%），宪法要求为语句/行 ≥80%。尚无 CI 工作流，覆盖率目前靠本地命令，需在 tasks 阶段补上。 |
| III. RESTful API | 通过。资源为名词复数；`GET` 读、`POST` 创建、`PATCH` 部分更新、`DELETE` 删除；冲突用 `409`；统一错误体。 | 通过。`POST /api/digests` 创建（`201`）、`regenerate` 替换（`200`）、同日重复（`409`）；契约见 [contracts/http-api.md](contracts/http-api.md)。 |
| IV. 前后端分离 | 通过。后端单独部署；前端只经 HTTP/JSON 取数。 | 通过。后端独立仓库、独立进程，Nginx 反代 `api.zhaotong.fun`；前端 `services/api.js` 是唯一出口；`site-data.json` 只作为后端导入输入。 |

无违规，Complexity Tracking 留空。

## Project Structure

### Documentation (this feature)

```text
blog/specs/003-daily-top10-news/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/http-api.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
~/jekyll/shamingai.github.io.server/   # 新增：独立的后端仓库/目录，单独部署
├── package.json                 # scripts: migrate / start / dev / generate / sync / test / coverage
├── .env.example                 # PORT, HOST, DB_PROFILE, MYSQL_TEST_*/MYSQL_PROD_*, DB_PATH, SITE_REPO_DIR, API_TOKEN, CORS_ORIGINS, LLM_*, SCHEDULER/SCHEDULE_*, DIGEST_SIZE, COLLECT_*, LINK_CHECK_*
├── .env.test / .env.prod        # 用户本地填写：两套 MySQL 的连接信息，不进仓库
├── deploy/                      # shamingai-server.service、nginx.conf（api.zhaotong.fun 反代）、Dockerfile（可选）
├── migrations/
│   ├── 001_init.sql             # MySQL 方言：source_sites, articles, article_tags, headings, site_meta,
│   │                            #   history_entries, digests, picked_items, runs
├── src/
│   ├── cli.js                   # migrate / serve / generate（含 --dry-run 纯预览）/ sync
│   ├── server.js                # 组装 db + app + 可选调度器
│   ├── app.js                   # Fastify 实例、CORS、错误处理
│   ├── config.js                # .env → .env.$DB_PROFILE → 环境变量；CORS 默认放行 https://blog.zhaotong.fun
│   ├── db.js                    # 驱动层：MySQL 优先，缺连接信息回退 node:sqlite，并做 SQL 方言转换
│   ├── routes/
│   │   ├── reader.js            # /api/posts, archive, categories, tags, search, about, history, digests, health
│   │   └── admin.js             # /api/source-sites, /api/content-syncs, /api/digests, /api/runs（Bearer 令牌）
│   ├── services/
│   │   ├── digest.js            # 每日生成编排：采集→去重→排名→整理→校验→补位→落盘→入库
│   │   ├── collect.js           # 按站点并发采集与失败隔离
│   │   ├── rank.js / order.js   # 热度分、去重、并列规则
│   │   ├── link-check.js        # 原文链接可访问性校验
│   │   ├── render.js            # PickedItem → Markdown（含 date/category/summary 指令）
│   │   ├── sync.js              # 从 SITE_REPO_DIR 的 content/ 导入
│   │   ├── article.js           # 阅读查询（列表、正文、归档、分类、标签、搜索、digest 结构化数据）
│   │   └── text.js              # 截断与文本归一化
│   ├── sources/
│   │   ├── index.js             # 适配器注册表与默认站点
│   │   ├── cn.js                # 国内热榜解析器：baidu-board / weibo-hot-search / zhihu-hot-list / toutiao-hot-board / sspai-popular
│   │   ├── generic.js           # 通用 links 适配器
│   │   └── shared.js            # 抓取、去重、链接绝对化等共用逻辑
│   ├── llm/
│   │   ├── client.js            # OpenAI 兼容调用，JSON 输出 + 校验
│   │   └── prompt.js
│   ├── scheduler.js             # 08:00 Asia/Shanghai 触发（生产 SCHEDULER=off）
│   └── errors.js                # { error: { code, message } } 统一错误
├── tests/
│   ├── unit/                    # rank, collect, digest 编排, render, llm 校验, db/config, sources, sync
│   └── contract/                # Fastify inject 覆盖 contracts/http-api.md（含 CORS 预检、health）
└── README.md

~/jekyll/shamingai.github.io/    # 本站仓库：前端与内容
blog/app/                        # 修改：只经 API 取数
├── .env.production              # VITE_API_BASE_URL=https://api.zhaotong.fun
├── .env.dev.example             # VITE_API_BASE_URL=http://localhost:8787；`npm run dev:api` 使用 .env.dev
├── src/services/api.js          # 唯一 HTTP 出口，读取 VITE_API_BASE_URL
├── src/services/paging.js       # 服务端分页状态
├── src/services/useResource.js  # loading / error+retry / empty 三态
├── src/pages/*.vue              # 改为调用 api.js；ArticlePage 统一渲染手写文章与资讯博客
└── tests/                       # 用假 fetch 覆盖三态、分页与资讯博客展示

blog/content/posts/              # 资讯博客的落盘位置（daily-YYYY-MM-DD.md），由 server 写入 SITE_REPO_DIR
```

**Structure Decision**: 后端整体放在 `~/jekyll/shamingai.github.io.server`，是与本站并列的独立目录（可作为独立 Git 仓库），拥有自己的 `package.json`、迁移、测试和部署文件，可单独构建部署；本站仓库不包含任何后端源码，只保留前端 `blog/app`、内容 `blog/content` 和规格文档。前端 `blog/app` 保持原结构，只把数据来源从静态文件换成 `src/services/api.js`。`blog/generator` 保留用于生成静态快照，但不再作为读者数据源。

## 实施阶段

### Phase 0 — 研究

见 [research.md](research.md)：Node/Fastify、数据库选型与双环境、仓库导入、站点适配器、LLM 整理器、去重与排名、幂等、前端对接、部署形态。

### Phase 1 — 设计

- 数据模型：[data-model.md](data-model.md)
- 接口契约：[contracts/http-api.md](contracts/http-api.md)
- 验收路径：[quickstart.md](quickstart.md)

### Phase 2 — 任务拆分

任务清单见 [tasks.md](tasks.md)。建议顺序：

1. 后端骨架：`npm` 包、`DB_PROFILE` 双环境配置、迁移、`/api/health`（含内容目录一致性）、错误体与令牌中间件。
2. 阅读接口：把本站仓库 `blog/content/` 的导入与 `002` 的读取能力落到 server 的数据库与 `/api/*`，前端 `api.js` 接入并跑通首页/正文/归档/分类/标签/搜索/关于/历史。
3. 采集：适配器注册表、首批站点适配器、`source_sites` 管理接口、失败隔离。
4. 整理与生成：去重排名、LLM 客户端与校验、链接校验与补位、Markdown 渲染与落盘、同日幂等、不足十条的 `note` 与零条的 `422`。
5. 调度与运维：`POST /api/digests` 的令牌鉴权、作者本地 08:00 调度器、`SCHEDULER=off` 的生产配置、`/api/runs/{id}`、Nginx 反代与 systemd 单元。
6. 契约与端到端验收：backend contract tests、frontend 三态测试、quickstart 全表。

## Complexity Tracking

| 偏离 | 原因 | 处理 |
|---|---|---|
| C1 同日幂等用 `409 duplicate_date` 而不是幂等 `201` | 需要把"当天已生成"与"刚生成"区分开，避免作者误以为覆盖了旧文章 | `regenerate:true` 显式替换并返回 `200`；`409` 的 `details.run_id` 指回已有那次运行 |
| C2 生成接口同步执行 LLM 与采集，最慢可达 10 分钟 | 只有一位作者、每天一次，排队与进度上报的成本不划算 | Nginx `proxy_read_timeout 600s`；失败原因写入 `runs`，由 `/api/runs/{id}` 查看 |
| C3 后端写文件到本站仓库的目录布局（`SITE_REPO_DIR` 跨仓库写入） | 资讯博客必须作为普通文章进入本站内容流水线，才能进首页、归档、标签与搜索 | 只写 `blog/content/posts/daily-*.md`，不执行 git；`/api/health` 检查内容目录一致性，不一致时整体 `degraded` |
| C4 非主路径依赖 `node:sqlite` | 离线试跑和测试需要不连 MySQL 也能跑 | 只在所选环境缺主机/账号时回退；MySQL 是主路径，迁移脚本以 MySQL 方言为准 |

## 风险与应对

- **热榜页面结构变化**：适配器按站点隔离，失败只影响该站；`/api/runs/{id}` 暴露原因。
- **LLM 输出不稳定**：强制 JSON + 严格校验，不合格条目剔除并由下一名补位。
- **外链失效**：生成时校验，读者点击时由原站处理。
- **迁移期间双数据源**：前端切换完成后删除对 `site-data.json` 的运行时依赖，避免两套结果不一致。
- **跨目录一致性**：server 写入本站仓库检出的资讯博客，需作者手动提交并推送后才进入 GitHub 历史；部署说明需标明 `SITE_REPO_DIR` 与写入权限，二者不一致时以 server 数据库为准并在 `/api/health` 中暴露。
- **MySQL 双环境写错库**：`DB_PROFILE` 只接受 `test` / `prod`，非法值直接启动失败；`prod` 的连接信息只放在部署机的 `.env.prod`，本地 `.env.test` 不会连到 `116.62.78.39`。
