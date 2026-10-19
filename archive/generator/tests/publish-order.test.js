import assert from "node:assert/strict";
import test from "node:test";
import { publishArticles } from "../src/rules/publish.js";
import { homeOrder, archiveYearOrder } from "../src/rules/order.js";
import { readingMinutes } from "../src/rules/reading.js";

test("rejects an article that cannot be published and keeps valid articles", () => {
  const result = publishArticles([
    {
      id: "valid",
      title: "可读",
      summary: "",
      body: "正文",
      category: "人工智能",
      tags: [],
      publishedOn: "2026-10-14"
    },
    {
      id: "empty",
      title: "空正文",
      body: "   ",
      category: "人工智能",
      publishedOn: "2026-10-14"
    },
    {
      id: "categories",
      title: "多个分类",
      body: "正文",
      category: ["人工智能", "深度学习"],
      publishedOn: "2026-10-14"
    }
  ]);

  assert.deepEqual(result.articles.map((article) => article.id), ["valid"]);
  assert.deepEqual(
    result.rejections.map((rejection) => [rejection.id, rejection.reason]),
    [
      ["empty", "empty_body"],
      ["categories", "multiple_categories"]
    ]
  );
});

test("orders articles newest first and by visible title on the same day", () => {
  const ordered = homeOrder([
    { title: "乙", publishedOn: "2026-10-14" },
    { title: "甲", publishedOn: "2026-10-14" },
    { title: "旧", publishedOn: "2026-10-13" }
  ]);

  assert.deepEqual(ordered.map((article) => article.title), ["甲", "乙", "旧"]);
});

test("orders one archive year from old to new", () => {
  const ordered = archiveYearOrder([
    { title: "乙", publishedOn: "2026-10-14" },
    { title: "甲", publishedOn: "2026-10-14" },
    { title: "更早", publishedOn: "2026-10-13" }
  ]);

  assert.deepEqual(ordered.map((article) => article.title), ["更早", "甲", "乙"]);
});

test("rounds reading time up and never shows zero minutes", () => {
  assert.equal(readingMinutes(1), 1);
  assert.equal(readingMinutes(400), 1);
  assert.equal(readingMinutes(401), 2);
});
