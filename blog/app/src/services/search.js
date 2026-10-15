export function searchArticles(articles, query) {
  const keyword = String(query ?? "").trim().toLocaleLowerCase();
  if (!keyword) return [];
  return articles.filter((article) =>
    [article.title, article.summary, article.body]
      .join("\n")
      .toLocaleLowerCase()
      .includes(keyword)
  );
}
