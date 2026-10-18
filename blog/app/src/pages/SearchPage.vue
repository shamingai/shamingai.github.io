<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing, useReloadOnQuery } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  articles: { type: Array, default: null },
  query: { type: String, default: "" },
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: null }
});
const route = useRoute() ?? { query: {} };
const router = useRouter();
const injected = props.articles !== null;
const keyword = computed(() => String(props.query || route.query.q || "").trim());
const resource = useResource(() =>
  keyword.value && !injected ? api.search(keyword.value, route.query) : { items: [] }
);
if (injected) resource.disable();
useReloadOnQuery(route, resource, ["q", "page"]);

const injectedVisible = computed(() => searchArticles(props.articles ?? [], keyword.value));
const items = computed(() => (injected ? injectedVisible.value : resource.data.value?.items ?? []));
const { page, count, visible } = useListing(route, {
  injected: computed(() => injected),
  data: resource.data,
  items,
  injectedPage: computed(() => (props.pageCount ? props.page : route.query.page))
});
const shown = computed(() => props.total ?? resource.data.value?.total ?? items.value.length);

function submit(event) {
  const value = event.target.elements.q.value.trim();
  router?.push({ query: value && value !== keyword.value ? { q: value } : { ...route.query, q: value || undefined } });
}
</script>

<template>
  <main class="page">
    <h1>搜索</h1>
    <form @submit.prevent="submit">
      <input name="q" :value="keyword" aria-label="搜索" />
      <button>搜索</button>
    </form>
    <p v-if="!keyword">请输入关键词</p>
    <template v-else>
      <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
      <template v-if="resource.state.value === 'ready'">
        <p v-if="items.length === 0">没有找到相关文章</p>
        <template v-else>
          <p>找到 {{ shown }} 篇</p>
          <ul class="list">
            <li v-for="article in visible" :key="article.slug ?? article.id">
              <RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.title }}</RouterLink>
              <p v-if="article.excerpt">{{ article.excerpt }}</p>
            </li>
          </ul>
          <Pager :page="page" :page-count="count" />
        </template>
      </template>
    </template>
  </main>
</template>
