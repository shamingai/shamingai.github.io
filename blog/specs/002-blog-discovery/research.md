# Research: 来都来了的博客浏览

## Decision: 继续使用现有技术栈

- **Decision**: 后端继续使用 Java 21 和 Spring Boot 3.5.6；前端继续使用 Vue 3.5 和 Vite 6；数据继续存储在现有数据库。
- **Rationale**: 本期是现有博客的浏览能力扩展，不需要更换已运行的阅读链路。
- **Alternatives considered**: 新引入静态站点生成器会替换现有后端读取流程，超出本期范围。

## Decision: 用文章开头的声明块表达归属

- **Decision**: `posts/*.md` 在第一行标题之后使用一个声明块。可包含 `date`、`summary`、`category` 和 `tags`。
- **Rationale**: 规格要求这些信息来自作者提交的内容。放在文章内能随 Git 提交一起更新，不需要网站后台。
- **Alternatives considered**: 从目录名推断分类会让一篇文章难以表达层级和标签。单独数据库编辑界面违反只展示边界。

声明块格式：

```markdown
标题
date: 2026-10-14
summary: 可选摘要
category: 人工智能/深度学习
tags: 原创, CNN
```

## Decision: 关于和历史使用独立文件

- **Decision**: 关于页读取 `about/index.md`。历史页读取 `history/*.md`，每个文件一条节点。
- **Rationale**: 两类内容都不是文章归档。独立文件避免它们被 `posts/` 的文章导入误收。
- **Alternatives considered**: 把历史节点放进 `posts/` 会违反「历史不是文章」的规格。

## Decision: 搜索只查询已保存文章

- **Decision**: 搜索后端已展示文章的标题、摘要和正文，不在搜索时访问 Gitee。
- **Rationale**: 规格要求不返回未展示或被拒绝的文件。已保存内容就是展示边界。
- **Alternatives considered**: 每次搜索都读取仓库会把未展示文件带入结果，也会让 Gitee 故障影响搜索。
