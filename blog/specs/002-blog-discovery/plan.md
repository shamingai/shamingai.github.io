# Implementation Plan: 来都来了的博客浏览

**Branch**: `002-blog-discovery` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-blog-discovery/spec.md`

## Summary

在现有 Gitee 博客展示链路中增加文章发现和阅读信息。作者继续通过 Git 提交 Markdown；网站从文章声明块提取日期、摘要、分类和标签，并提供首页、正文、归档、分类、标签、搜索、关于和历史页面。

## Technical Context

**Language/Version**: 后端 Java 21；前端 Vue 3.5 与原生 JavaScript

**Primary Dependencies**: 现有 Spring Boot 3.5.6、Spring JDBC、Flyway、Vue 3.5、Vite 6

**Storage**: 沿用现有数据库。生产目标仍是 MySQL；本地运行可继续使用已配置的 H2 文件库

**Testing**: 后端 JUnit 5；前端 Vitest 与 Vue Test Utils

**Target Platform**: 现有 Linux 服务器后端和现代桌面浏览器前端

**Project Type**: 前后端分离的 Web 应用扩展

**Performance Goals**: 首页、归档和搜索第一页在 1 秒内返回；一次读取最多处理 300 篇文章

**Constraints**: 不新增在线编辑、评论、点赞或多作者；搜索不得访问 Gitee；历史节点不得进入文章表

**Scale/Scope**: 一位作者、最多 300 篇文章、分类层级最多三级

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **代码质量优先**: 通过。文章解析、查询和页面按职责分开。
- **测试覆盖率不低于 80%**: 通过。新增解析、查询和页面状态必须有自动化测试。
- **RESTful API**: 通过。新增接口全部使用复数名词或单一资源的 GET。
- **前后端分离**: 通过。前端只读取 `/api`，后端不渲染页面。

Phase 1 后复检通过。无宪法违规。

## Project Structure

### Documentation (this feature)

```text
specs/002-blog-discovery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/http-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/main/java/blog/
├── api/
├── services/
└── models/

frontend/src/
├── pages/
├── components/
└── services/
```

**Structure Decision**: 沿用现有前后端目录。后端新增解析和查询服务；前端新增归档、分类、标签、搜索、关于和历史页面。

## Complexity Tracking

无宪法违规，不填写。
