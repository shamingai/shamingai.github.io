<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing, useReloadOnQuery } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: null },
  years: { type: Array, default: null }
});
const route = useRoute() ?? { query: {} };
const injected = ref(props.years !== null);
const resource = useResource(() => api.archive(route.query));
if (injected.value) resource.disable();
useReloadOnQuery(route, resource, ["page"]);

const withYear = (article, year) => ({ ...article, year });
const items = computed(() =>
  injected.value
    ? props.years.flatMap((year) => year.articles.map((article) => withYear(article, year.name)))
    : (resource.data.value?.items ?? []).map((article) => withYear(article, article.published_on.slice(0, 4)))
);
const total = computed(() => props.total ?? resource.data.value?.total ?? 0);
const { page, count, visible } = useListing(route, {
  injected,
  data: resource.data,
  items,
  injectedPage: computed(() => (props.pageCount ? props.page : route.query.page))
});
</script>

<template>
  <main class="page">
    <h1>归档</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p>{{ total }} 篇</p>
      <ul class="list">
        <li v-for="article in visible" :key="article.slug ?? article.id" class="panel">
          <p class="meta">{{ article.year }}</p>
          <RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.title }}</RouterLink>
        </li>
      </ul>
      <Pager :page="page" :page-count="count" />
    </template>
  </main>
</template>