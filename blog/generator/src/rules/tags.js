import { homeOrder } from "./order.js";

export function usedTags(articles) {
  const names = new Set(articles.flatMap((article) => article.tags ?? []));
  return [...names]
    .sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))
    .map((name) => ({ name, articles: articlesWithTag(articles, name) }));
}

export function articlesWithTag(articles, tag) {
  return homeOrder(articles.filter((article) => (article.tags ?? []).includes(tag)));
}
