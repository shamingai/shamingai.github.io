import assert from "node:assert/strict";
import test from "node:test";
import { headingsFromBody } from "../src/rules/headings.js";
import { neighborsFor, renderArticle } from "../src/render/article.js";

test("builds anchors only for locatable headings", () => {
  assert.deepEqual(headingsFromBody("引言\n\n## 第一节\n\n内容\n\n### 细节"), [
    { text: "第一节", anchor: "第一节", level: 2 },
    { text: "细节", anchor: "细节", level: 3 }
  ]);
  assert.deepEqual(headingsFromBody("没有标题"), []);
});

test("renders neighbors from home order and hides a missing side", () => {
  const html = renderArticle(
    {
      id: "newest",
      title: "最新",
      body: "## 第一节\n\n正文",
      publishedOn: "2026-10-14"
    },
    { previous: null, next: { id: "older", title: "更旧" } }
  );

  assert.match(html, /最新/);
  assert.match(html, /2026-10-14/);
  assert.match(html, /2/);
  assert.match(html, /1 分钟/);
  assert.match(html, /href="#第一节"/);
  assert.match(html, /href="\/articles\/older"/);
  assert.doesNotMatch(html, /上一篇/);
});

test("chooses neighbors from home order", () => {
  const articles = [
    { id: "old", title: "旧", publishedOn: "2026-10-13" },
    { id: "same-b", title: "乙", publishedOn: "2026-10-14" },
    { id: "same-a", title: "甲", publishedOn: "2026-10-14" }
  ];

  assert.deepEqual(
    [neighborsFor(articles[2], articles).previous, neighborsFor(articles[2], articles).next?.id],
    [null, "same-b"]
  );
  assert.equal(neighborsFor(articles[0], articles).next, null);
});

test("renders a missing article without the old body", () => {
  const html = renderArticle(null);

  assert.match(html, /文章不存在/);
  assert.doesNotMatch(html, /旧正文/);
});
