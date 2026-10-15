export function article(input) {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary ?? "",
    body: input.body,
    category: input.category,
    tags: input.tags ?? [],
    publishedOn: input.publishedOn,
    wordCount: input.wordCount,
    readingMinutes: input.readingMinutes,
    headings: input.headings ?? []
  };
}

export function category(input) {
  return {
    name: input.name,
    parent: input.parent ?? null,
    articleCount: input.articleCount
  };
}

export function tag(input) {
  return {
    name: input.name,
    articles: input.articles
  };
}

export function heading(input) {
  return {
    text: input.text,
    anchor: input.anchor,
    level: input.level
  };
}

export function historyEvent(input) {
  return {
    date: input.date,
    text: input.text,
    articleId: input.articleId ?? null
  };
}
