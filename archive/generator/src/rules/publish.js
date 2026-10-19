function readableText(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

function rejection(article, reason) {
  return { id: article.id, reason };
}

export function publishArticles(inputs) {
  const articles = [];
  const rejections = [];

  for (const article of inputs) {
    if (!String(article.title ?? "").trim()) {
      rejections.push(rejection(article, "missing_title"));
      continue;
    }
    if (!readableText(article.body)) {
      rejections.push(rejection(article, "empty_body"));
      continue;
    }
    const categories = Array.isArray(article.category) ? article.category : [article.category];
    const present = categories.filter((category) => String(category ?? "").trim());
    if (present.length === 0) {
      rejections.push(rejection(article, "missing_category"));
      continue;
    }
    if (present.length > 1) {
      rejections.push(rejection(article, "multiple_categories"));
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(article.publishedOn ?? ""))) {
      rejections.push(rejection(article, "invalid_date"));
      continue;
    }
    articles.push({ ...article, category: present[0] });
  }

  return { articles, rejections };
}
