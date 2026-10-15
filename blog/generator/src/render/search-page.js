export function renderSearchPage() {
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>搜索</title></head><body><main><h1>搜索</h1><form><label>关键词 <input name="q"></label><button>搜索</button></form><p id="result"></p></main><script type="module" src="/search.js"></script></body></html>`;
}

export function renderSearchScript() {
  return `const result = document.querySelector("#result");
const keyword = new URLSearchParams(location.search).get("q")?.trim() ?? "";
if (!keyword) {
  result.textContent = "请输入关键词";
} else {
  const items = await fetch("/search-data.json").then((response) => response.json());
  const found = items.filter((item) => [item.title, item.summary, item.body].join("\\n").toLocaleLowerCase().includes(keyword.toLocaleLowerCase()));
  result.innerHTML = found.length ? found.map((item) => \`<p><a href="/articles/\${item.id}.html">\${item.title}</a></p>\`).join("") : "没有找到相关文章";
}`;
}
