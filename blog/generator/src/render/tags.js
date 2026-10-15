import { articlesWithTag, usedTags } from "../rules/tags.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderTagIndex(articles) {
  const items = usedTags(articles)
    .map((tag) => `<li><a href="/tags/${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</a></li>`)
    .join("");
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>标签</title></head><body><main><h1>标签</h1><ul>${items}</ul></main></body></html>`;
}

export function renderTag(articles, tag) {
  const items = articlesWithTag(articles, tag)
    .map((article) => `<li><a href="/articles/${escapeHtml(article.id)}">${escapeHtml(article.title)}</a> ${escapeHtml(article.category)}</li>`)
    .join("");
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>${escapeHtml(tag)}</title></head><body><main><h1>${escapeHtml(tag)}</h1><ul>${items}</ul></main></body></html>`;
}
