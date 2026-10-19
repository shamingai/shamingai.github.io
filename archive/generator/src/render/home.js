import { homeOrder } from "../rules/order.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderHome(articles) {
  const ordered = homeOrder(articles);
  const items = ordered.map((article) => {
    const summary = article.summary ? article.summary : "暂无摘要";
    const tags = (article.tags ?? []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");
    return `<li><a href="/articles/${escapeHtml(article.id)}">${escapeHtml(article.title)}</a><p>${escapeHtml(summary)}</p><p>${escapeHtml(article.category)}</p><ul>${tags}</ul></li>`;
  });
  const body = items.length ? `<ul class="post-list">${items.join("")}</ul>` : "<p>暂时没有文章</p>";
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>文章</title></head><body><header><a href="/">首页</a> <a href="/archive/">归档</a> <a href="/categories/">分类</a> <a href="/tags/">标签</a> <a href="/search/">搜索</a> <a href="/about/">关于</a> <a href="/history/">历史</a></header><main class="home"><h1>文章</h1>${body}</main></body></html>`;
}
