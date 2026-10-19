import { headingsFromBody } from "../rules/headings.js";
import { homeOrder } from "../rules/order.js";
import { readingMinutes, wordCount } from "../rules/reading.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function neighbor(label, article) {
  if (!article) return "";
  return `<a href="/articles/${escapeHtml(article.id)}">${label}：${escapeHtml(article.title)}</a>`;
}

export function neighborsFor(article, articles) {
  const ordered = homeOrder(articles);
  const index = ordered.findIndex((item) => item.id === article.id);
  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null
  };
}

export function renderArticle(article, neighbors = {}) {
  if (!article) {
    return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>文章不存在</title></head><body><main><p>文章不存在</p><p><a href="/">返回首页</a></p></main></body></html>`;
  }
  const headings = headingsFromBody(article.body);
  const count = wordCount(article.body);
  const contents = headings.length
    ? `<nav><ol>${headings.map((heading) => `<li><a href="#${escapeHtml(heading.anchor)}">${escapeHtml(heading.text)}</a></li>`).join("")}</ol></nav>`
    : "";
  const body = String(article.body)
    .split(/\r?\n/)
    .map((line) => {
      const heading = /^(#{2,6})\s+(\S.*?)\s*$/.exec(line);
      if (heading) return `<h${heading[1].length} id="${escapeHtml(heading[2])}">${escapeHtml(heading[2])}</h${heading[1].length}>`;
      return line.trim() ? `<p>${escapeHtml(line)}</p>` : "";
    })
    .join("");
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>${escapeHtml(article.title)}</title></head><body><p><a href="/">返回首页</a></p><main><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.publishedOn)}</p><p>${count} 字</p><p>${readingMinutes(count)} 分钟</p>${contents}${body}<p>${neighbor("上一篇", neighbors.previous)}${neighbor("下一篇", neighbors.next)}</p></main></body></html>`;
}
