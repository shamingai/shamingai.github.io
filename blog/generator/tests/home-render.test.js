import assert from "node:assert/strict";
import test from "node:test";
import { publishArticles } from "../src/rules/publish.js";
import { renderHome } from "../src/render/home.js";

test("home output contains only published articles in home order", () => {
  const { articles } = publishArticles([
    {
      id: "later",
      title: "乙",
      summary: "",
      body: "正文",
      category: "人工智能",
      tags: ["标签"],
      publishedOn: "2026-10-14"
    },
    {
      id: "earlier-title",
      title: "甲",
      summary: "摘要",
      body: "正文",
      category: "人工智能",
      tags: [],
      publishedOn: "2026-10-14"
    },
    {
      id: "hidden",
      title: "未发布",
      summary: "不应出现",
      body: "",
      category: "人工智能",
      publishedOn: "2026-10-15"
    }
  ]);

  const html = renderHome(articles);

  assert.equal(html.indexOf("甲") < html.indexOf("乙"), true);
  assert.match(html, /href="\/articles\/earlier-title"/);
  assert.match(html, /暂无摘要/);
  assert.match(html, /摘要/);
  assert.match(html, /标签/);
  assert.doesNotMatch(html, /未发布/);
  assert.doesNotMatch(html, /不应出现/);
});
