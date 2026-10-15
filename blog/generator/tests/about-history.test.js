import assert from "node:assert/strict";
import test from "node:test";
import { renderAbout } from "../src/render/about.js";
import { renderHistory } from "../src/render/history.js";

test("renders an author introduction instead of an article list", () => {
  assert.match(renderAbout("我是作者"), /我是作者/);
  assert.doesNotMatch(renderAbout("我是作者"), /共有/);
  assert.match(renderAbout(""), /暂时没有内容/);
});

test("keeps a history event after its article is unpublished and removes the link", () => {
  const html = renderHistory(
    [
      { date: "2026-10-14", text: "站点迁移", articleId: "gone" },
      { date: "2026-10-13", text: "发布第一篇", articleId: "first" }
    ],
    new Set(["first"])
  );

  assert.match(html, /站点迁移/);
  assert.match(html, /href="\/articles\/first"/);
  assert.doesNotMatch(html, /href="\/articles\/gone"/);
  assert.equal(html.indexOf("2026-10-13") < html.indexOf("2026-10-14"), true);
});
