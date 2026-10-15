export const PAGE_SIZE = 10;

export function pageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pageItems(items, page) {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export function currentPage(value, total) {
  const count = pageCount(total);
  const page = Number(value) || 1;
  return Math.min(Math.max(page, 1), count);
}
