import { homeOrder } from "../rules/order.js";

export function searchData(articles) {
  return homeOrder(articles).map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary ?? "",
    body: article.body
  }));
}
