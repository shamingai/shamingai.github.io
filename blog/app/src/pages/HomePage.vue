<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { query: {} };
const injected = ref(props.articles !== null);
const resource = useResource(() => api.posts(route.query));
if (injected.value) resource.disable();
const articles = computed(() => (injected.value ? props.articles : resource.data.value?.items ?? []));
const { page, count, visible } = useListing(route, {
  injected,
  data: resource.data,
  items: articles,
  injectedPage: computed(() => route.query.page)
});
</script>

<template>
  <section class="hero">
    <div>
      <p>不得不亏，得之血赚</p>
    </div>
  </section>
  <main class="page">
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p v-if="articles.length === 0" class="panel">暂时没有文章</p>
      <ul v-else class="cards">
        <li v-for="article in visible" :key="article.slug ?? article.id" class="card">
          <h2><RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.title }}</RouterLink></h2>
          <RouterLink :to="`/articles/${article.slug ?? article.id}`">{{ article.summary || "暂无摘要" }}</RouterLink>
          <p class="meta">
            <time>{{ article.published_on ?? article.publishedOn }}</time>
            <RouterLink v-if="article.category_path ?? article.category" :to="`/categories/${article.category_path ?? article.category}`">
              {{ article.category_path ?? article.category }}
            </RouterLink>
          </p>
          <p class="tags">
            <RouterLink v-for="tag in article.tags" :key="tag" :to="`/tags/${tag}`">#{{ tag }}</RouterLink>
          </p>
        </li>
      </ul>
      <Pager :page="page" :page-count="count" />
    </template>
  </main>
</template>
