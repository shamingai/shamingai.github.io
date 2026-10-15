# Data Model: 来都来了的博客浏览

## Article

在现有 `blog_post` 上增加：

- `published_on`: 发布日期。优先取声明中的 `date`，否则取仓库更新时间的日期。
- `summary`: 不超过 120 个字符。
- `summary_generated`: 布尔值。作者未提供摘要时为真。
- `category_path`: 用 `/` 分隔的分类路径，最多三级，可为空。
- `word_count`: 正文可见文字数。
- `reading_minutes`: `word_count / 300` 向上取整，最小为 1。

## Tag

- `article_path`: 关联文章。
- `name`: 标签名称，1 到 30 个字符。

一篇文章可有多个标签。同一篇文章的同名标签只保留一个。

## Heading

- `article_path`: 关联文章。
- `level`: 章节级别，只记录 2 到 3 级。
- `text`: 章节标题。
- `anchor`: 页内定位标识。
- `position`: 在正文中的顺序。

## History Entry

- `path`: `history/` 下的文件路径，主键。
- `title`: 文件第一行。
- `occurred_on`: 节点日期。
- `body`: 节点说明。

历史节点不写入 `blog_post`。

## About Profile

- `body`: `about/index.md` 的正文。
- `updated_at`: 仓库更新时间。

全站只保留一份。文件缺失时不保存旧内容，页面显示尚未编写。
