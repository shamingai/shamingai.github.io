# HTTP API Contract: 博客浏览

本契约只新增公开读取能力，沿用 `/api` 和现有错误结构。所有接口都是 GET，不要求登录。

## `GET /api/posts`

列表项新增：

```json
{
  "path": "sdd.md",
  "title": "标题",
  "summary": "摘要",
  "summary_generated": false,
  "published_on": "2026-10-14",
  "category_path": "人工智能/深度学习",
  "tags": ["原创"]
}
```

## `GET /api/posts/{path}`

响应新增 `published_on`、`word_count`、`reading_minutes`、`headings`、`previous` 和 `next`。相邻文章不存在时对应字段为 `null`。

## `GET /api/archive`

按年份返回文章，查询参数为 `page`，默认 1，每页 20 篇。

## `GET /api/categories`

返回分类树。每个节点包含 `name`、`path`、`article_count` 和 `children`。

## `GET /api/categories/{path}/posts`

返回该分类直接包含的文章和数量。

## `GET /api/tags`

返回标签和文章数量。

## `GET /api/tags/{name}/posts`

返回该标签下的文章和数量。

## `GET /api/search`

查询参数为 `q` 和 `page`。`q` 去掉首尾空格后为空时返回 `400`。结果只包含已展示文章，并包含 `excerpt`。

## `GET /api/about`

返回关于介绍。内容缺失时返回 `404`，`code` 为 `about_not_written`。

## `GET /api/history`

按日期从新到旧返回历史节点。没有节点时返回空列表。
