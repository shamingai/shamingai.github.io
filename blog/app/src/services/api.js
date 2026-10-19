import { PAGE_SIZE } from "./paging.js";

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { token } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, { headers });
  } catch (cause) {
    throw new ApiError("无法连接服务器", 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error?.message ?? `接口返回 ${response.status}`, response.status);
  }
  return body;
}

function pageQuery(query = {}, defaultSize = PAGE_SIZE) {
  const params = new URLSearchParams({ page_size: String(defaultSize) });
  if (query.page && Number(query.page) > 1) params.set("page", String(query.page));
  return params;
}

function pathPart(value) {
  return encodeURIComponent(value);
}

export const api = {
  posts: (query, pageSize = PAGE_SIZE) => request(`/posts?${pageQuery(query, pageSize)}`),
  post: (slug) => request(`/posts/${pathPart(slug)}`),
  archive: (query) => request(`/archive?${pageQuery(query)}`),
  categories: () => request("/categories"),
  categoryPosts: (name, query) => request(`/categories/${pathPart(name)}/posts?${pageQuery(query)}`),
  tags: () => request("/tags"),
  tagPosts: (name, query) => request(`/tags/${pathPart(name)}/posts?${pageQuery(query)}`),
  search: (q, query) => {
    const params = pageQuery(query);
    params.set("q", q);
    return request(`/search?${params}`);
  },
  about: () => request("/about"),
  history: () => request("/history"),
  digests: (query) => request(`/digests?${pageQuery(query)}`),
  digest: (date) => request(`/digests/${pathPart(date)}`)
};
