const result = document.querySelector("#result");
const keyword = new URLSearchParams(location.search).get("q")?.trim() ?? "";
if (!keyword) {
  result.textContent = "请输入关键词";
} else {
  const items = await fetch("/search-data.json").then((response) => response.json());
  const found = items.filter((item) => [item.title, item.summary, item.body].join("\n").toLocaleLowerCase().includes(keyword.toLocaleLowerCase()));
  result.innerHTML = found.length ? found.map((item) => `<p><a href="/articles/${item.id}.html">${item.title}</a></p>`).join("") : "没有找到相关文章";
}