import { articlesInCategory, categoryCounts } from "../rules/categories.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderCategoryIndex(articles) {
  const items = categoryCounts(articles)
    .map((category) => `<li><a href="/categories/${escapeHtml(category.name)}">${escapeHtml(category.name)}</a> ${category.articleCount}</li>`)
    .join("");
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>分类</title></head><body><main><h1>分类</h1><ul>${items}</ul></main></body></html>`;
}

export function renderCategory(articles, category) {
  const visible = articlesInCategory(articles, category);
  const items = visible
    .map((article) => `<li><a href="/articles/${escapeHtml(article.id)}">${escapeHtml(article.title)}</a></li>`)
    .join("");
  const body = items || "<p>暂时没有文章</p>";
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>${escapeHtml(category)}</title></head><body><main><h1>${escapeHtml(category)}</h1>${body}</main></body></html>`;
}
