---

description: "Task list for blog discovery implementation"
---

# Tasks: 来都来了的博客浏览

**Input**: Design documents from `/specs/002-blog-discovery/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-api.md, quickstart.md

**Tests**: 项目宪法要求测试和后端行覆盖率不低于 80%，因此包含测试任务。

**Organization**: 按用户故事分组。现有博客的仓库绑定和正文展示保持不变。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事
- 路径相对于仓库根目录

## Phase 1: Setup

**Purpose**: 为现有数据库添加浏览字段

- [ ] T001 Add a Flyway migration in `backend/src/main/resources/db/migration/V2__add_discovery_fields.sql` for `published_on`, `summary`, `summary_generated`, `category_path`, `word_count`, `reading_minutes`, tags, headings, history entries, and about profile

## Phase 2: Foundational

**Purpose**: 建立所有故事共用的文章声明解析

- [ ] T002 [P] Add a failing parser test in `backend/src/test/java/blog/unit/ArticleMetadataParserTest.java` for date, summary, category, tags, generated summary, word count, and headings
- [ ] T003 Implement metadata parsing in `backend/src/main/java/blog/services/ArticleMetadataParser.java`, limiting summary to 120 characters, category depth to 3, and tag names to 30 characters

**Checkpoint**: 文章声明可以被稳定解析

## Phase 3: User Story 1 - 从首页进入文章 (Priority: P1) 🎯 MVP

**Goal**: 首页显示摘要、发布日期、分类和标签

**Independent Test**: 三篇文章按发布日期从新到旧显示归属信息，并能进入对应正文

### Tests for User Story 1

- [ ] T004 [P] [US1] Add a failing contract test in `backend/src/test/java/blog/contract/HomeArticleContractTest.java` for the extended `GET /api/posts` item

### Implementation for User Story 1

- [ ] T005 [P] [US1] Extend `backend/src/main/java/blog/models/BlogPost.java` with published date, summary, generated flag, category path, and tags
- [ ] T006 [US1] Persist the new article fields in `backend/src/main/java/blog/services/BlogStore.java`
- [ ] T007 [US1] Return the extended list item from `backend/src/main/java/blog/api/PostController.java`
- [ ] T008 [P] [US1] Render summary, date, category, and tags in `frontend/src/pages/PostListPage.vue`

**Checkpoint**: 首页可独立验收

## Phase 4: User Story 2 - 阅读正文并继续阅读 (Priority: P2)

**Goal**: 正文页显示字数、阅读时间、目录和相邻文章

**Independent Test**: 三篇按日期排列的文章中，中间一篇的上一篇和下一篇正确，目录只包含 2 到 3 级标题

### Tests for User Story 2

- [ ] T009 [P] [US2] Add a failing contract test in `backend/src/test/java/blog/contract/ArticleDetailContractTest.java` for headings and adjacent articles

### Implementation for User Story 2

- [ ] T010 [US2] Add heading and adjacent-article queries to `backend/src/main/java/blog/services/PostQueryService.java`
- [ ] T011 [US2] Extend `GET /api/posts/{path}` in `backend/src/main/java/blog/api/PostController.java` with `word_count`, `reading_minutes`, `headings`, `previous`, and `next`
- [ ] T012 [P] [US2] Render the reading metadata and adjacent links in `frontend/src/pages/PostDetailPage.vue`

**Checkpoint**: 正文阅读可独立验收

## Phase 5: User Story 3 - 按归档、分类和标签找到文章 (Priority: P3)

**Goal**: 提供年份归档、直接分类列表和标签列表

**Independent Test**: 归档按年份分页；上级分类只返回直接归属文章；标签数量与文章列表一致

### Tests for User Story 3

- [ ] T013 [P] [US3] Add a failing contract test in `backend/src/test/java/blog/contract/DiscoveryNavigationContractTest.java` for archive, categories, and tags

### Implementation for User Story 3

- [ ] T014 [P] [US3] Implement archive, category, and tag queries in `backend/src/main/java/blog/services/DiscoveryQueryService.java`
- [ ] T015 [US3] Implement the archive, category, and tag endpoints in `backend/src/main/java/blog/api/DiscoveryController.java`
- [ ] T016 [P] [US3] Create archive, category, and tag pages in `frontend/src/pages/ArchivePage.vue`, `frontend/src/pages/CategoryPage.vue`, and `frontend/src/pages/TagPage.vue`

**Checkpoint**: 三种浏览路径可独立验收

## Phase 6: User Story 4 - 搜索已展示文章 (Priority: P4)

**Goal**: 搜索只返回已展示文章的标题、摘要或正文匹配

**Independent Test**: 唯一词能返回匹配片段；空白关键词返回 400；未展示文件不会出现

### Tests for User Story 4

- [ ] T017 [P] [US4] Add a failing search contract test in `backend/src/test/java/blog/contract/SearchContractTest.java`

### Implementation for User Story 4

- [ ] T018 [US4] Implement displayed-article search in `backend/src/main/java/blog/services/SearchService.java`
- [ ] T019 [US4] Implement `GET /api/search` in `backend/src/main/java/blog/api/SearchController.java`
- [ ] T020 [P] [US4] Create the search page in `frontend/src/pages/SearchPage.vue`

**Checkpoint**: 搜索可独立验收

## Phase 7: User Story 5 - 阅读关于和历史 (Priority: P5)

**Goal**: 展示关于介绍和历史节点，且历史不进入文章归档

**Independent Test**: 关于页显示仓库介绍；历史按日期从新到旧显示；归档不包含历史节点

### Tests for User Story 5

- [ ] T021 [P] [US5] Add a failing contract test in `backend/src/test/java/blog/contract/SitePagesContractTest.java` for about and history

### Implementation for User Story 5

- [ ] T022 [P] [US5] Implement about and history imports in `backend/src/main/java/blog/services/SiteContentImporter.java`
- [ ] T023 [US5] Implement `GET /api/about` and `GET /api/history` in `backend/src/main/java/blog/api/SiteContentController.java`
- [ ] T024 [P] [US5] Create `frontend/src/pages/AboutPage.vue` and `frontend/src/pages/HistoryPage.vue`

**Checkpoint**: 站点页可独立验收

## Phase 8: Polish

**Purpose**: 接通导航并完成整体验收

- [ ] T025 [P] Add navigation links for archive, categories, tags, search, about, and history to `frontend/src/App.vue`
- [ ] T026 Run the scenarios in `specs/002-blog-discovery/quickstart.md` and verify backend line coverage remains at least 80%

## Dependencies

- Phase 1 and Phase 2 block all user stories.
- US1 starts after Phase 2 and is the MVP.
- US2 depends on article metadata from US1.
- US3, US4, and US5 can proceed in parallel after US1 data is available.
- Phase 8 depends on the pages selected for delivery.

## Parallel Example: User Story 3

```bash
Task: "Add DiscoveryNavigationContractTest in backend/src/test/java/blog/contract/DiscoveryNavigationContractTest.java"
Task: "Create ArchivePage in frontend/src/pages/ArchivePage.vue"
Task: "Create CategoryPage in frontend/src/pages/CategoryPage.vue"
Task: "Create TagPage in frontend/src/pages/TagPage.vue"
```

## Implementation Strategy

1. 完成 Phase 1 和 Phase 2。
2. 完成 US1 后停止验收首页。
3. 再按 P2 到 P5 增量交付正文、浏览、搜索和站点页。
4. 每个故事都使用自己的 Independent Test，不把后续故事当作前置条件。

## Notes

- 上级分类只返回直接归属的文章，因为规格写的是「直接包含」。
- 不实现评论、点赞、在线编辑或多作者。
- 搜索不得调用 Gitee。
