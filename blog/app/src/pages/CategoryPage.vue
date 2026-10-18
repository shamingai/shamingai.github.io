<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing, useReloadOnQuery } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  categories: { type: Array, default: null },
  category: { type: String, default: "" },
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { params: {}, query: {} };
const injected = ref(props.categories !== null || props.articles !== null);
const name = computed(() => props.category || route.params.name || "");
const resource = useResource(() => (name.value ? api.categoryPosts(name.value, route.query) : api.categories()));
if (injected.value) resource.disable();
useReloadOnQuery(route, resource, ["page"]);

const categories = computed(() => (name.value ? [] : props.categories ?? resource.data.value?.items ?? []));
const articles = computed(() => props.articles ?? (name.value ? resource.data.value?.items ?? [] : []));
const { page, count, visible: visibleArticles } = useListing(route, {
  injected,
  data: resource.data,
  items: articles,
  injectedPage: computed(() => route.query.page)
});
</script>

<template>
  <main class="page">
    <h1>{{ name || "分类" }}</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <ul v-if="categories.length" class="list">
        <li v-for="item in categories" :key="item.path ?? item.name">
          <RouterLink :to="`/categories/${item.path ?? item.name}`">{{ item.name }} · {{ item.article_count ?? item.articleCount ?? 0 }}</RouterLink>
        </li>
      </ul>
      <template v-else>
        <p v-if="articles.length === 0" class="panel">暂时没有文章</p>
        <ul v-else class="list">
          <li v-for="article in visibleArticles" :key="article.slug ?? article.id">
            <RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.title }}</RouterLink>
          </li>
        </ul>
        <Pager :page="page" :page-count="count" />
      </template>
    </template>
  </main>
</template>
