function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderHistory(events, publishedIds = new Set()) {
  const items = [...events]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((event) => {
      const link = event.articleId && publishedIds.has(event.articleId)
        ? `<a href="/articles/${escapeHtml(event.articleId)}">查看文章</a>`
        : "";
      return `<li><time>${escapeHtml(event.date)}</time> ${escapeHtml(event.text)} ${link}</li>`;
    })
    .join("");
  const body = items || "<p>暂时没有内容</p>";
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>历史</title></head><body><main><h1>历史</h1><ol>${body}</ol></main></body></html>`;
}
