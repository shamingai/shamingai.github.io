import assert from "node:assert/strict";
import test from "node:test";
import { usedTags, articlesWithTag } from "../src/rules/tags.js";
import { renderTagIndex, renderTag } from "../src/render/tags.js";

const articles = [
  {
    id: "both",
    title: "两个标签",
    category: "人工智能",
    tags: ["模型", "人工智能"],
    publishedOn: "2026-10-14"
  },
  {
    id: "one",
    title: "一个标签",
    category: "深度学习",
    tags: ["模型"],
    publishedOn: "2026-10-13"
  }
];

test("lists only tags used by published articles", () => {
  assert.deepEqual(usedTags(articles).map((tag) => tag.name), ["模型", "人工智能"]);
  assert.deepEqual(articlesWithTag(articles, "模型").map((article) => article.id), ["both", "one"]);
});

test("keeps a tag link separate from a same-named category", () => {
  const html = renderTagIndex(articles);

  assert.match(html, /href="\/tags\/人工智能"/);
  assert.doesNotMatch(html, /href="\/categories\/人工智能"/);
  assert.match(renderTag(articles, "人工智能"), /两个标签/);
  assert.doesNotMatch(renderTag(articles, "人工智能"), /一个标签/);
});
