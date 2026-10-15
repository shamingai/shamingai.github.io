import { homeOrder } from "./order.js";

function parentOf(name) {
  const separator = name.lastIndexOf(" / ");
  return separator === -1 ? null : name.slice(0, separator);
}

export function categoryCounts(articles) {
  const counts = new Map();
  for (const article of articles) {
    counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
    for (let parent = parentOf(article.category); parent; parent = parentOf(parent)) {
      if (!counts.has(parent)) counts.set(parent, 0);
    }
  }
  return [...counts.keys()]
    .sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))
    .map((name) => ({ name, parent: parentOf(name), articleCount: counts.get(name) }));
}

export function articlesInCategory(articles, category) {
  return homeOrder(articles.filter((article) => article.category === category));
}
