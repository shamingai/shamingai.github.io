# Implementation Plan: Gitee 博客

**Branch**: `001-gitee-blog` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-gitee-blog/spec.md`

## Summary

读者站点提供首页文章流、正文阅读、归档、层级分类、标签、站内搜索、关于和历史。文章在本地写作，生成静态站点后发布。生成时确定发布资格、排序、字数、阅读时间、目录、分类数量和相邻文章。站点不提供在线编辑、后台、仓库绑定或上传入口。

## Technical Context

**Language/Version**: 静态站点生成器使用 Node.js，与现有 `frontend/` 的 Node 工具链一致。Java 21 / Spring Boot 3.5.6 只属于旧实现，不作为新阅读站点的运行时。

**Primary Dependencies**: 现有 Vue 3 与 Vue Router 用于读者页面。生成器不新增运行时服务，也不新增数据库。

**Storage**: 本地写作内容作为生成输入；发布产物是静态文件。不使用 MySQL、H2 或运行时内容库。

**Testing**: 生成规则使用 Node 测试。读者页面使用现有 Vitest 与 Vue Test Utils。45 篇归档、分类数量和搜索范围使用生成后的静态站点做端到端验收。

**Target Platform**: 可静态托管的网站，作者用自己的 Gitee 仓库保存写作内容并发布生成结果。

**Project Type**: 静态网站加本地生成器。

**Performance Goals**: 45 篇规模下，95% 的关键词搜索在 1 秒内给出结果。首页到正文的首次路径在 1 分钟内可完成。

**Constraints**: 只展示已发布文章。父分类不继承子分类文章。同一天按标题排序。归档年份内从旧到新，其余文章列表从新到旧。无在线编辑、后台、访客账号、评论和点赞。

**Scale/Scope**: 一位作者、一个已发布站点。验收样例为 45 篇已发布文章。页面范围为首页、正文、归档、分类、标签、搜索、关于和历史。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 计划前 | 设计后 |
|---|---|---|
| I. 代码质量优先 | 通过。新阅读规则集中在生成器，页面只展示生成结果。 | 通过。排序、计数和发布资格各有一个规则来源。 |
| II. 测试覆盖率不低于 80% | 通过。生成规则、页面状态和端到端验收都纳入测试。 | 通过。quickstart 覆盖规格中的读者路径和拒绝路径。 |
| III. RESTful API | 不适用。本期没有对外 HTTP API。不新增动词式或 RPC 式接口。 | 通过。读者契约是静态页面，不是伪装成 API 的后台。 |
| IV. 前后端分离 | 通过。写作生成与读者页面分开。旧后端不再作为新功能的内容服务。 | 通过。页面契约不依赖运行中的后端、数据库或会话。 |

Phase 0 与 Phase 1 后没有未解释的违规。

## Project Structure

### Documentation (this feature)

```text
specs/001-gitee-blog/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── reader-pages.md
└── tasks.md             # 由 /speckit-tasks 更新，本命令不修改
```

### Source Code (repository root)

```text
generator/
├── src/
│   ├── model/
│   ├── rules/
│   └── render/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

site/                   # 生成后的静态站点，不作为手写源码
```

**Structure Decision**: 使用 `generator/` 产生静态站点，使用 `frontend/` 承载读者页面。`backend/` 是旧的仓库绑定与同步实现，本功能不扩展它。旧的 `contracts/http-api.md` 已由 `contracts/reader-pages.md` 替代，因为新规格不再提供 HTTP 内容管理接口。

## Complexity Tracking

无宪法违规，不需要豁免。

## Phase 0: Research

已完成于 [research.md](research.md)。没有未解决的 NEEDS CLARIFICATION。

## Phase 1: Design

- 数据模型：[data-model.md](data-model.md)
- 页面契约：[contracts/reader-pages.md](contracts/reader-pages.md)
- 验收指南：[quickstart.md](quickstart.md)

设计后的宪法检查已通过。`/speckit-plan` 在 Phase 1 结束，不生成 `tasks.md`。
