import assert from "node:assert/strict";
import test from "node:test";
import { searchData } from "../src/render/search-data.js";

test("search data keeps only published title, summary, and body in home order", () => {
  const data = searchData([
    {
      id: "old",
      title: "旧",
      summary: "旧摘要",
      body: "旧正文",
      category: "不应索引",
      tags: ["历史"],
      publishedOn: "2026-10-13"
    },
    {
      id: "new",
      title: "新",
      summary: "新摘要",
      body: "新正文",
      category: "人工智能",
      tags: ["模型"],
      publishedOn: "2026-10-14"
    }
  ]);

  assert.deepEqual(data.map((item) => item.id), ["new", "old"]);
  assert.deepEqual(Object.keys(data[0]).sort(), ["body", "id", "summary", "title"]);
  assert.equal(JSON.stringify(data).includes("不应索引"), false);
});
