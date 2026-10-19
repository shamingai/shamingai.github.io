function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderAbout(text) {
  const body = String(text ?? "").trim() ? `<p>${escapeHtml(text)}</p>` : "<p>暂时没有内容</p>";
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>关于</title></head><body><main><h1>关于</h1>${body}</main></body></html>`;
}
