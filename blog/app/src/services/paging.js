import { computed, watch } from "vue";

export const PAGE_SIZE = 10;

export function pageCount(total, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / Math.max(1, size)));
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

// 列表页两种数据来源：
// - 注入 props（测试用）：用 pageItems 在本地切片；
// - 接口返回：后端已经切好一页，直接展示，总页数取 total / page_size。
export function useListing(route, { injected, data, items, injectedPage }) {
  const listing = computed(() => {
    if (injected.value) {
      const page = currentPage(injectedPage.value, items.value.length);
      return { page, count: pageCount(items.value.length), visible: pageItems(items.value, page) };
    }
    const page = Number(route.query?.page) || data.value?.page || 1;
    return {
      page,
      count: pageCount(data.value?.total ?? 0, data.value?.page_size ?? PAGE_SIZE),
      visible: items.value
    };
  });
  return {
    page: computed(() => listing.value.page),
    count: computed(() => listing.value.count),
    visible: computed(() => listing.value.visible)
  };
}

// query 变化时重新请求；分页切换由 Pager 负责 push query。
export function useReloadOnQuery(route, resource, keys) {
  watch(
    () => keys.map((key) => route.query?.[key]),
    () => resource.reload()
  );
}
