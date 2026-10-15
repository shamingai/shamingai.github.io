import assert from "node:assert/strict";
import test from "node:test";
import { archivePages } from "../src/rules/archive.js";
import { renderArchive } from "../src/render/archive.js";

function article(id, publishedOn) {
  return { id, title: id, publishedOn };
}

test("groups 45 articles by year and pages them without gaps", () => {
  const articles = Array.from({ length: 45 }, (_, index) => {
    const year = index < 20 ? "2025" : "2026";
    const day = String(index + 1).padStart(2, "0");
    return article(`a${String(index).padStart(2, "0")}`, `${year}-01-${day}`);
  });

  const pages = archivePages(articles, 10);
  const ids = pages.pages.flat().map((item) => item.id);

  assert.equal(pages.total, 45);
  assert.equal(pages.pages.length, 5);
  assert.equal(new Set(ids).size, 45);
  assert.deepEqual(ids.slice(0, 20), articles.slice(0, 20).map((item) => item.id));
  assert.deepEqual(ids.slice(20), articles.slice(20).map((item) => item.id));
  assert.deepEqual(pages.years.map((year) => year.name), ["2025", "2026"]);
});

test("renders the total and omits pagination for one page", () => {
  const html = renderArchive([article("only", "2026-10-14")], 1);

  assert.match(html, /共有 1 篇/);
  assert.match(html, /2026/);
  assert.doesNotMatch(html, /page\/2/);
});
