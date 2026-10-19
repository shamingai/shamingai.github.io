import assert from "node:assert/strict";
import test from "node:test";
import { categoryCounts, articlesInCategory } from "../src/rules/categories.js";
import { renderCategoryIndex, renderCategory } from "../src/render/categories.js";

const articles = [
  { id: "parent", title: "父分类文章", category: "人工智能", publishedOn: "2026-10-13" },
  { id: "child", title: "子分类文章", category: "人工智能 / 深度学习", publishedOn: "2026-10-14" }
];

test("counts only articles assigned directly to each category", () => {
  assert.deepEqual(categoryCounts(articles), [
    { name: "人工智能", parent: null, articleCount: 1 },
    { name: "人工智能 / 深度学习", parent: "人工智能", articleCount: 1 }
  ]);
  assert.deepEqual(articlesInCategory(articles, "人工智能").map((article) => article.id), ["parent"]);
});

test("renders the parent without child articles", () => {
  const html = renderCategory(articles, "人工智能");

  assert.match(html, /父分类文章/);
  assert.doesNotMatch(html, /子分类文章/);
  assert.match(renderCategoryIndex(articles), /人工智能 \/ 深度学习/);
});
