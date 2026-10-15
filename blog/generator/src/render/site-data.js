import { archivePages } from "../rules/archive.js";
import { categoryCounts, articlesInCategory } from "../rules/categories.js";
import { headingsFromBody } from "../rules/headings.js";
import { homeOrder } from "../rules/order.js";
import { readingMinutes, wordCount } from "../rules/reading.js";
import { usedTags, articlesWithTag } from "../rules/tags.js";
import { neighborsFor } from "./article.js";

export function siteData(articles, content) {
  const ordered = homeOrder(articles).map((article) => {
    const neighbors = neighborsFor(article, articles);
    const count = wordCount(article.body);
    return {
      ...article,
      wordCount: count,
      readingMinutes: readingMinutes(count),
      headings: headingsFromBody(article.body),
      previous: neighbors.previous ? { id: neighbors.previous.id, title: neighbors.previous.title } : null,
      next: neighbors.next ? { id: neighbors.next.id, title: neighbors.next.title } : null
    };
  });
  const archive = archivePages(ordered);
  return {
    articles: ordered,
    archive: {
      total: archive.total,
      pageCount: archive.pages.length,
      years: archive.years
    },
    categories: categoryCounts(ordered).map((category) => ({
      ...category,
      articles: articlesInCategory(ordered, category.name)
    })),
    tags: usedTags(ordered).map((tag) => ({
      name: tag.name,
      articles: articlesWithTag(ordered, tag.name)
    })),
    about: content.about ?? "",
    history: (content.history ?? []).map((event) => ({
      ...event,
      articleId: ordered.some((article) => article.id === event.articleId) ? event.articleId : null
    }))
  };
}
