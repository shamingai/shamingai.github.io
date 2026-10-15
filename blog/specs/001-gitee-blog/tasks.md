---
description: "Task list for Gitee 博客 static reader site"
---

# Tasks: Gitee 博客

**Input**: Design documents from `/specs/001-gitee-blog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reader-pages.md, quickstart.md

**Tests**: Included because constitution II makes line coverage ≥ 80% a merge gate. Write each story test before its implementation and confirm it fails first.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

## Path Conventions

- Generator: `generator/src/`, `generator/tests/`
- Reader pages: `frontend/src/`, `frontend/tests/`
- Generated output: `site/`
- Do not extend `backend/` for this feature.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the static generator without adding a content-management runtime.

- [x] T001 Create `generator/package.json` with a Node.js ESM package and a `node:test` script; do not add a web framework or database dependency.
- [x] T002 [P] Add `generator/src/cli.js` that accepts a content directory and a `site/` output directory.
- [x] T003 [P] Replace the old reader routes in `frontend/src/router.js` with `/`, `/articles/:id`, `/archive`, `/categories`, `/tags`, `/search`, `/about`, and `/history`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared content rules required by every reader page.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create the Article, Category, Tag, Heading, and History Event structures in `generator/src/model/content.js`. Article fields are `id`, `title`, `summary`, `body`, `category`, `tags`, `publishedOn`, `wordCount`, `readingMinutes`, and `headings`, with the nullability and cardinality from `specs/001-gitee-blog/data-model.md`.
- [x] T005 Add publication guards in `generator/src/rules/publish.js`: reject missing title, empty body, word count 0, missing or multiple categories, and missing or unreadable `publishedOn`; report identity and reason; continue publishing valid articles.
- [x] T006 Add shared ordering in `generator/src/rules/order.js`: home order is `publishedOn` descending then visible `title` ascending; archive-year order is `publishedOn` ascending then visible `title` ascending.
- [x] T007 Add reading metrics in `generator/src/rules/reading.js`: count readable body characters, and set `readingMinutes` to `max(1, ceil(wordCount / 400))`.
- [x] T008 Add `generator/tests/publish-order.test.js` for rejection reasons, both sort orders, and the reading-time floor before wiring those rules into pages.

**Checkpoint**: Valid articles, rejected articles, and stable ordering can be produced without any page.

---

## Phase 3: User Story 1 - 首页文章流 (Priority: P1) 🎯 MVP

**Goal**: Show the latest published articles with title, summary, category, and tags, and link each item to its article.

**Independent Test**: Generate a site with published and unpublished articles and open `/`; only published articles appear, newest first, same-day items by title, and each item links to its article.

### Tests for User Story 1

- [x] T009 [P] [US1] Add a failing home-page contract test in `frontend/tests/home-page.test.js` for `/` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 1

- [x] T010 [US1] Generate `site/index.html` from published articles in `generator/src/render/home.js`, using home order and showing `暂无摘要` when summary is empty.
- [x] T011 [US1] Render the article stream in `frontend/src/pages/HomePage.vue` with one category, all tags, and one article link per item.
- [x] T012 [US1] Show `暂时没有文章` in `frontend/src/pages/HomePage.vue` when no published article exists.

**Checkpoint**: User Story 1 is functional before article details, archive, taxonomy, or search exist.

---

## Phase 4: User Story 2 - 文章阅读 (Priority: P1)

**Goal**: Show article metadata, body, table of contents, and adjacent published articles.

**Independent Test**: Open one published article and verify title, date, word count, reading time, body, working contents links, and home-order previous/next links.

### Tests for User Story 2

- [x] T013 [P] [US2] Add a failing article-page contract test in `frontend/tests/article-page.test.js` for `/articles/{id}` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 2

- [x] T014 [P] [US2] Build heading anchors in `generator/src/rules/headings.js`, omitting the contents block when no locatable heading exists.
- [x] T015 [US2] Generate `site/articles/{id}.html` in `generator/src/render/article.js` with previous and next links taken only from home order.
- [x] T016 [US2] Render title, `publishedOn`, `wordCount`, `readingMinutes`, body, and contents in `frontend/src/pages/ArticlePage.vue`.
- [x] T017 [US2] Render `文章不存在` without the old body in `frontend/src/pages/ArticlePage.vue` when `{id}` is unknown or unpublished.

**Checkpoint**: Home and article reading work independently of archive and discovery pages.

---

## Phase 5: User Story 3 - 归档 (Priority: P2)

**Goal**: List every published article by year, show the total, and paginate 10 articles per page.

**Independent Test**: Generate 45 articles across at least two years and verify `共有 45 篇`, old-to-new order within each year, and complete non-overlapping pagination.

### Tests for User Story 3

- [x] T018 [P] [US3] Add a failing archive contract test in `frontend/tests/archive-page.test.js` for `/archive` and `/archive/page/{n}` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 3

- [x] T019 [US3] Group published articles by year in `generator/src/rules/archive.js`, using archive-year order and excluding history events.
- [x] T020 [US3] Generate `site/archive/index.html` and `site/archive/page/{n}.html` in `generator/src/render/archive.js` with page size 10 and no pagination control on a single page.
- [x] T021 [US3] Render the total, year groups, and page links in `frontend/src/pages/ArchivePage.vue`.

**Checkpoint**: Archive can be verified with 45 articles without using category, tag, or search pages.

---

## Phase 6: User Story 4 - 分类 (Priority: P2)

**Goal**: Show hierarchical categories and count only articles directly assigned to each category.

**Independent Test**: Assign one article directly to `人工智能` and another to `人工智能 / 深度学习`; the parent list and count exclude the child article.

### Tests for User Story 4

- [x] T022 [P] [US4] Add a failing category contract test in `frontend/tests/category-page.test.js` for `/categories` and `/categories/{category}` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 4

- [x] T023 [US4] Count only directly assigned published articles in `generator/src/rules/categories.js`; a parent count must not include child-category articles.
- [x] T024 [US4] Generate `site/categories/index.html` and `site/categories/{category}.html` in `generator/src/render/categories.js` using home order.
- [x] T025 [US4] Render hierarchy, direct counts, and the empty state `暂时没有文章` in `frontend/src/pages/CategoryPage.vue`.

**Checkpoint**: Category pages are correct even when tag pages are absent.

---

## Phase 7: User Story 5 - 标签 (Priority: P2)

**Goal**: Browse published articles by zero or more tags without changing the single category.

**Independent Test**: Open an article with two tags and find it on both tag pages while it still has one category.

### Tests for User Story 5

- [x] T026 [P] [US5] Add a failing tag contract test in `frontend/tests/tag-page.test.js` for `/tags` and `/tags/{tag}` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 5

- [x] T027 [US5] Include only tags used by at least one published article in `generator/src/rules/tags.js`.
- [x] T028 [US5] Generate `site/tags/index.html` and `site/tags/{tag}.html` in `generator/src/render/tags.js` using home order.
- [x] T029 [US5] Render tag links separately from same-named categories in `frontend/src/pages/TagPage.vue`.

**Checkpoint**: Tag browsing works without merging tags into categories.

---

## Phase 8: User Story 6 - 站内搜索 (Priority: P2)

**Goal**: Search only published article titles, summaries, and bodies from any main page.

**Independent Test**: Search a published title, summary, and body term, then search a term that exists only in an unpublished article; only published matches appear.

### Tests for User Story 6

- [x] T030 [P] [US6] Add a failing search contract test in `frontend/tests/search-page.test.js` for `/search?q={keyword}` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 6

- [x] T031 [US6] Generate `site/search-data.json` in `generator/src/render/search-data.js` with only published title, summary, and body text.
- [x] T032 [US6] Match case-insensitively, trim surrounding spaces, and sort by home order in `frontend/src/services/search.js`.
- [x] T033 [US6] Add the global search entry and render `没有找到相关文章` in `frontend/src/pages/SearchPage.vue`.
- [x] T034 [US6] Keep an empty or whitespace-only keyword on the current page with an input prompt in `frontend/src/components/SearchBox.vue`.

**Checkpoint**: Search returns no category names, tag names, about text, or history text.

---

## Phase 9: User Story 7 - 关于与历史 (Priority: P3)

**Goal**: Publish an author introduction and an independent blog timeline.

**Independent Test**: Open About, History, and Archive and confirm none substitutes for another; a history event remains after its linked article is unpublished, without an article link.

### Tests for User Story 7

- [x] T035 [P] [US7] Add a failing about/history contract test in `frontend/tests/about-history-page.test.js` for `/about` and `/history` against `specs/001-gitee-blog/contracts/reader-pages.md`.

### Implementation for User Story 7

- [x] T036 [P] [US7] Render the author introduction, or `暂时没有内容`, in `generator/src/render/about.js` and `frontend/src/pages/AboutPage.vue`.
- [x] T037 [US7] Render dated history events in `generator/src/render/history.js` and `frontend/src/pages/HistoryPage.vue`, removing article links whose target is unpublished.

**Checkpoint**: About and History are independent of Archive.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Remove old management paths and validate the complete static site.

- [x] T038 [P] Remove binding and sync entries from `frontend/src/App.vue` and `frontend/src/router.js`.
- [x] T039 [P] Add a static-output check in `generator/tests/no-admin-entry.test.js` that fails when generated HTML contains online editing, admin, repository binding, or upload entry text.
- [x] T040 Run the 45-article validation in `specs/001-gitee-blog/quickstart.md` and record the result in `specs/001-gitee-blog/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Stories (Phases 3–9)**: Depend on Foundational. US2 uses article identity from US1 but remains separately testable. US3–US7 can proceed in parallel after Phase 2.
- **Polish (Phase 10)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2.
- **US2 (P1)**: Starts after Phase 2; uses the article address produced for US1.
- **US3 (P2)**: Starts after Phase 2; no dependency on categories, tags, or search.
- **US4 (P2)**: Starts after Phase 2; no dependency on tags.
- **US5 (P2)**: Starts after Phase 2; must not merge same-named categories and tags.
- **US6 (P2)**: Starts after Phase 2; uses published article text only.
- **US7 (P3)**: Starts after Phase 2; does not require Archive implementation.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004–T007 touch different files and can run in parallel; T008 follows them.
- Story contract tests T009, T013, T018, T022, T026, T030, and T035 can run in parallel after Phase 2.
- After Phase 2, US3, US4, US5, US6, and US7 can be assigned to different implementers.

---

## Parallel Example: After Foundational

```bash
Task: "T018 [US3] archive contract test in frontend/tests/archive-page.test.js"
Task: "T022 [US4] category contract test in frontend/tests/category-page.test.js"
Task: "T026 [US5] tag contract test in frontend/tests/tag-page.test.js"
Task: "T030 [US6] search contract test in frontend/tests/search-page.test.js"
Task: "T035 [US7] about/history contract test in frontend/tests/about-history-page.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3.
3. Stop and open `/` to validate the published article stream.

### Incremental Delivery

1. Add US2 to complete reading.
2. Add US3 for the 45-article archive.
3. Add US4 and US5 for topic browsing.
4. Add US6 for keyword lookup.
5. Add US7 for About and History.
6. Run Phase 10 before calling the feature complete.

### Parallel Team Strategy

After Phase 2, one implementer can take US1–US2, another US3–US4, and another US5–US7. Each story keeps its own test and page files.

---

## Notes

- Do not add tasks that extend `backend/src/` or `specs/001-gitee-blog/contracts/http-api.md`; that contract has been retired.
- Same-day title ordering applies to every article list. Archive years additionally sort from old to new.
- Parent category counts exclude child-category articles.
- Unpublished articles remain absent from pages, counts, search data, and adjacent links.
