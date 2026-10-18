<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing, useReloadOnQuery } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  tags: { type: Array, default: null },
  tag: { type: String, default: "" },
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { params: {}, query: {} };
const injected = ref(props.tags !== null || props.articles !== null);
const name = computed(() => props.tag || route.params.name || "");
const resource = useResource(() => (name.value ? api.tagPosts(name.value, route.query) : api.tags()));
if (injected.value) resource.disable();
useReloadOnQuery(route, resource, ["page"]);

const tags = computed(() => (name.value ? [] : props.tags ?? resource.data.value?.items ?? []));
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
    <h1>{{ name || "标签" }}</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <ul v-if="tags.length" class="list">
        <li v-for="item in tags" :key="item.name">
          <RouterLink :to="`/tags/${item.name}`">{{ item.name }}</RouterLink>
        </li>
      </ul>
      <p v-else-if="!name" class="panel">暂时没有标签</p>
      <template v-else>
        <p v-if="articles.length === 0" class="panel">暂时没有文章</p>
        <ul v-else class="list">
          <li v-for="article in visibleArticles" :key="article.slug ?? article.id">
            <RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.title }}</RouterLink>
            <p>{{ article.category_path ?? article.category }}</p>
          </li>
        </ul>
        <Pager v-if="articles.length" :page="page" :page-count="count" />
      </template>
    </template>
  </main>
</template>
