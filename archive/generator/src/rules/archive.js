import { archiveYearOrder } from "./order.js";

export function archivePages(articles, pageSize = 10) {
  const byYear = new Map();
  for (const article of articles) {
    const name = article.publishedOn.slice(0, 4);
    byYear.set(name, [...(byYear.get(name) ?? []), article]);
  }
  const years = [...byYear.keys()]
    .sort()
    .map((name) => ({ name, articles: archiveYearOrder(byYear.get(name)) }));
  const ordered = years.flatMap((year) => year.articles);
  const pages = [];
  for (let index = 0; index < ordered.length; index += pageSize) {
    pages.push(ordered.slice(index, index + pageSize));
  }
  return { total: ordered.length, years, pages };
}
