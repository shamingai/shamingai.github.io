# Quickstart: 每日热门前十资讯博客

本指南验证「前后端分离、后端单独部署」下，后端能采集、整理并生成当天的资讯博客，前端能通过接口阅读它。

## 1. 启动后端（独立进程）

```bash
cd ~/jekyll/shamingai.github.io.server
npm install
export API_TOKEN=dev-token
export LLM_BASE_URL=http://127.0.0.1:11434/v1   # 任意 OpenAI 兼容接口
export LLM_MODEL=qwen2.5:7b
export SITE_REPO_DIR=~/jekyll/shamingai.github.io  # 本站仓库检出，用于导入 blog/content/ 与写入资讯博客
npm run migrate
npm run dev                                      # 默认 :8787
```

`migrate` 会把内置的 5 个来源站点（百度、微博、知乎、头条、少数派）写入清单，无需手动准备。查看与调整：

```bash
curl -s localhost:8787/api/source-sites | head -c 400
# 启停或换地址；adapter 取值见 src/sources/index.js
curl -X PATCH localhost:8787/api/source-sites/weibo-hot \
  -H "Authorization: Bearer dev-token" -H 'content-type: application/json' \
  -d '{"enabled":false}'
```

## 2. 生成今天的资讯博客

本地或测试环境直接调本机：

```bash
curl -X POST localhost:8787/api/digests -H "Authorization: Bearer dev-token"
# 201 -> { run_id, date, slug: "daily-2026-10-18", item_count: 10, note: null, status: "generated", ... }
```

生产环境（每日 08:00 由作者本地调度器触发，见第 5 节）经 Nginx 调用：

```bash
curl -fsS -X POST https://api.zhaotong.fun/api/digests -H "Authorization: Bearer $API_TOKEN"
```

再执行一次应返回 `409 duplicate_date`；`-d '{"regenerate":true}'` 返回 `200` 并替换。
生成后检查 `blog/content/posts/daily-2026-10-18.md` 内容无误，再在本站仓库手动 `git add` / `commit` / `push`（后端不自动推送）。

## 3. 启动前端并指向后端

正式前端：<https://blog.zhaotong.fun/>，构建时通过 `blog/app/.env.production` 里的 `VITE_API_BASE_URL=https://api.zhaotong.fun` 指向线上后端（Nginx 反代，见 server 仓库 `deploy/nginx.conf`）。

本地测试用 `/api` 代理，不需要 CORS：

```bash
cd ~/jekyll/shamingai.github.io/blog/app
npm run dev         # Vite 把 /api 代理到 127.0.0.1:8787
```

本地直连后端（不经过代理，走真实跨域，用来验证 CORS）：

```bash
cp .env.dev.example .env.dev         # VITE_API_BASE_URL=http://localhost:8787
npm run dev:api                      # vite --mode dev
# 后端 .env 里追加：CORS_ORIGINS=https://blog.zhaotong.fun,http://localhost:5173
```

| 场景 | 操作 | 预期 |
|---|---|---|
| 首页 | 打开 `/` | 今天的资讯博客在最新文章榜首，带「资讯」标签 |
| 正文 | 点开该博客 | 来源站点、摘要（≤200 字）、推荐理由（≤100 字）、排名与可点击原文链接 |
| 标签 | 打开 `/tags/资讯` | 所有日期的资讯博客按日期从新到旧 |
| 搜索 | 搜某条资讯标题中的词 | 命中当天博客并给出片段 |
| API 直连 | `GET /api/digests/2026-10-18` | `items` 恰好等于博客中的条目，`rank` 从 1 连续 |
| 幂等 | 同一天再次生成 | `409 duplicate_date`，数据库仍只有一篇 |
| 站点失败 | 停用一个站点的 `hot_list_url` 使其超时 | 其他站点正常，`GET /api/runs/{run_id}` 中该站 `failed` |
| 不足十条 | 只启用一个站点且其只提供 5 条可用候选 | `201`，博客收录 5 条，开头说明不足十条的原因 |
| 一条都没有 | 只启用一个站点且其热榜不可用 | `422 insufficient_content`，不写入博客 |
| 后端不可用 | 停掉后端再打开页面 | 页面显示加载失败与重试，不显示「没有文章」 |

外链校验：逐条点击博客中的原文链接，确认可打开且内容与标题一致（SC-002）。

## 4. 自动化验收

```bash
cd ~/jekyll/shamingai.github.io.server && npm test          # 契约、去重、排名、幂等、失败隔离、剔除补位
cd ~/jekyll/shamingai.github.io.server && npm run coverage  # 宪法要求行覆盖率 ≥80%
cd ~/jekyll/shamingai.github.io/blog/app && npm test        # 页面三态与资讯博客展示
```

测试使用假采集器与假整理器，不访问外网、不调用 LLM。

## 5. 生产部署与每日触发

后端只监听 `127.0.0.1:8787`，由 Nginx 反代 `https://api.zhaotong.fun/api/`（`deploy/nginx.conf`；`/health` 不在 `/api/` 下，会返回 404；健康检查用 `GET https://api.zhaotong.fun/api/health`）。systemd 单元 `deploy/shamingai-server.service` 启动 `npm run start`。

生产 `.env` 的关键项：

```bash
HOST=127.0.0.1
PORT=8787
DB_PROFILE=prod                  # MYSQL_PROD_* 写在 .env.prod（连接 116.62.78.39）；本地试跑用 DB_PROFILE=test 读 .env.test
SITE_REPO_DIR=/srv/shamingai.github.io
API_TOKEN=<足够长的随机串>
CORS_ORIGINS=https://blog.zhaotong.fun
SCHEDULER=off                    # 生产不启用后端定时器，由作者本地调度器触发（澄清 Q1 = C）
```

作者本地 crontab（每天 08:00 Asia/Shanghai；令牌放在仓库外的文件里，不写进 crontab）：

```cron
0 8 * * * curl -fsS -X POST https://api.zhaotong.fun/api/digests -H "Authorization: Bearer $(cat ~/.config/shamingai/api-token)" >> ~/Library/Logs/shamingai-digest.log 2>&1
```

发布：生成成功后，在本站仓库检查 `blog/content/posts/daily-YYYY-MM-DD.md`，手动 `git add` / `commit` / `push`；后端不会自动提交或推送（澄清 Q2 = A）。

验收：`curl -i https://api.zhaotong.fun/api/health` 返回 `200`；未带令牌调 `POST /api/digests` 返回 `401 unauthorized`；带令牌返回 `201` 或 `409 duplicate_date`。
