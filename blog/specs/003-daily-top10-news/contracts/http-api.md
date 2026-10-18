# HTTP API Contract: 博客阅读与每日资讯（后端单独部署）

后端独立进程，前缀 `/api`，只提供 `application/json`。生产环境由 Nginx 把 `https://api.zhaotong.fun/api/` 反代到 `http://127.0.0.1:8787`，后端进程不直接对外。前端通过 `VITE_API_BASE_URL` 访问（正式值 `https://api.zhaotong.fun`），跨域由后端 `@fastify/cors` 按 `CORS_ORIGINS` 白名单控制，默认只放行 `https://blog.zhaotong.fun`。除“创建生成 / 替换生成”两个写操作外，所有接口无状态、`GET` 幂等。

## 通用约定

- 错误体：`{ "error": { "code": "string", "message": "string" } }`
- 状态码：`400` 参数错误，`401` 未授权（仅管理接口），`404` 不存在，`409` 冲突，`422` 内容不足未生成，`503` 依赖不可用或管理接口停用（`admin_disabled`）。
- 列表接口使用 `page`（默认 1）与 `page_size`（默认 10，最大 100；非整数或越界 → `400 invalid_page_size`），返回 `{ "items": [], "total": n, "page": 1, "page_size": 10 }`。分页规则统一实现于 `src/services/article.js`。
- 时间均为 ISO-8601 UTC，`*_on` 日期为上海时间 `YYYY-MM-DD`。
- CORS：预检 `OPTIONS` 由 `@fastify/cors` 处理并返回 `204`，只回显白名单内的 `Origin`；响应头由后端生成，Nginx 不重复添加。

## 读接口（读者）

### `GET /api/health`
`200 { "status": "ok", "db": "ok", "last_sync_at": "..." }`；数据库探测失败时 `503 { "status": "degraded", "db": "error", last_sync_at }`。Nginx 只转发 `/api/` 前缀，`/health` 返回 `404`，健康检查统一用本路径。

### `GET /api/posts`
列表项：`slug, title, summary, summary_generated, published_on, category_path, tags[]`。仅返回已发布。

### `GET /api/posts/{slug}`
`slug, title, summary, published_on, word_count, reading_minutes, headings[], body, category_path, tags[], previous, next, kind`。相邻不存在时为 `null`。`kind` 为 `post` 或 `digest`。资讯博客与手写文章走同一路径、同一 `body`（澄清 Q4 = A）；`404 post_not_found`。

### `GET /api/archive`、`GET /api/categories`、`GET /api/categories/{path}/posts`、`GET /api/tags`、`GET /api/tags/{name}/posts`、`GET /api/search?q=&page=`、`GET /api/about`、`GET /api/history`
沿用 `002-blog-discovery` 契约，语义不变。资讯博客同样出现在归档、`资讯` 标签与搜索结果中（FR-014）；`GET /api/search` 缺 `q` 时 `400 empty_query`。

### `GET /api/digests`
参数 `page`。返回 `{ items: [{ date, slug, title, item_count, status, generated_at }], total, page, page_size }`，按 `date` 从新到旧。

### `GET /api/digests/{date}`
`200`：`{ date, slug, title, item_count, note, status, generated_at, items: [{ rank, url, title, site_id, site_name, site_rank, mention_count, summary, reason, published_at }] }`
`404` `digest_not_found`。
该接口只提供文章的结构化条目，是 `GET /api/posts/{slug}` 的附加数据；正文以文章接口为准（澄清 Q4 = A）。`note` 在不足十条时说明原因，十条齐全时为 `null`。

## 管理接口（仅作者）

认证：请求头 `Authorization: Bearer <API_TOKEN>`，按字符串精确比对。受保护的是 `POST/PATCH/DELETE /api/source-sites*`（`GET` 站点清单不受保护）、`POST /api/content-syncs`、`POST /api/digests`、`GET /api/runs/*`。令牌缺失或错误 → `401 unauthorized`；未配置 `API_TOKEN` 时上述接口一律 `503 admin_disabled`。

### `GET /api/source-sites` / `POST /api/source-sites`
`POST` 体：`{ id, name, home_url, hot_list_url, adapter, weight?, max_candidates?, enabled? }`。`201` 返回站点。重复 `id` → `409`。

### `PATCH /api/source-sites/{id}`
部分更新 `name, hot_list_url, weight, max_candidates, enabled`。未知 `adapter` → `400 invalid_adapter`。

### `DELETE /api/source-sites/{id}`
`204`。历史入选条目保留，不再参与采集。

### `POST /api/content-syncs`
从 `SITE_REPO_DIR` 的 `blog/content/` 拉取并导入。`202 { "run_id": "..." }`。

### `POST /api/digests`
生产环境的正常调用者是作者本地每天 08:00 的调度器（澄清 Q1 = C）：

```bash
curl -fsS -X POST https://api.zhaotong.fun/api/digests -H "Authorization: Bearer $API_TOKEN"
```

体：`{ "date"?: "YYYY-MM-DD", "regenerate"?: false }`，缺省日期为上海时间今天；格式非法 `400 invalid_date`。生成是同步的（采集 → 去重 → 排名 → LLM 整理 → 链接校验 → 补位 → 落盘 → 入库），可能耗时数分钟，Nginx 为 `/api/` 配置了 600s 读超时。

- `201`：生成了新博客，返回 `{ run_id, date, slug, item_count, note, status: "generated", markdown_path, site_results, dropped }`
- `200`：`regenerate: true` 且当天已有博客时整体替换，返回同上，`status: "replaced"`
- `409 duplicate_date`：当天已有，且未要求重生成（`runs.outcome = skipped_existing`）
- `422 insufficient_content`：站点清单为空，或清单内站点全部失败，或没有任何条目通过校验与链接检查（澄清 Q3 = A）。不写 Markdown 与文章；`runs.outcome = failed`，`site_results` / `dropped` 记录原因，响应体带 `run_id`
- `503 llm_not_configured`：未配置 `LLM_BASE_URL` / `LLM_MODEL`
- 入选 1～9 条时仍返回 `201` 并生成，`item_count` 反映实际条数，`note` 写明原因

### `GET /api/runs/{run_id}`
返回 `RunReport`：`{ run_id, kind, started_at, finished_at, site_results[], dropped[], outcome }`。`404 run_not_found`。

## 契约测试

server 目录的 `tests/contract/`：用 Fastify 的 `inject` 对上述每个路径做状态码与字段形状断言（含 `page_size` 默认 10、CORS 预检、令牌 401/503、`409`/`422`/`503 llm_not_configured`），数据来自内存 SQLite；本站仓库的 `blog/app/tests/` 用假 `fetch` 覆盖加载中、失败重试、空列表三态。
