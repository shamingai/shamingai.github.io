import { archivePages } from "../rules/archive.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderArchive(articles, page = 1, pageSize = 10) {
  const archive = archivePages(articles, pageSize);
  const visible = new Set((archive.pages[page - 1] ?? []).map((article) => article.id));
  const years = archive.years
    .map((year) => {
      const items = year.articles
        .filter((article) => visible.has(article.id))
        .map((article) => `<li><a href="/articles/${escapeHtml(article.id)}">${escapeHtml(article.title)}</a></li>`)
        .join("");
      return items ? `<section><h2>${escapeHtml(year.name)}</h2><ul>${items}</ul></section>` : "";
    })
    .join("");
  const links = archive.pages.length > 1
    ? archive.pages.map((_, index) => `<a href="/archive/page/${index + 1}">${index + 1}</a>`).join("")
    : "";
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>归档</title></head><body><main><h1>归档</h1><p>共有 ${archive.total} 篇</p>${years}${links}</main></body></html>`;
}
