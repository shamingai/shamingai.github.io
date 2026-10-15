<script setup>
import { computed, onMounted, ref } from "vue";
import Pager from "../components/Pager.vue";
import { currentPage, pageCount, pageItems } from "../services/paging.js";
import { useRoute } from "vue-router";
import { searchArticles } from "../services/search.js";
import { loadSite } from "../services/site.js";

const props = defineProps({
  articles: { type: Array, default: null },
  query: { type: String, default: "" }
});
const route = useRoute() ?? { query: {} };
const articles = ref(props.articles ?? []);
const query = computed(() => props.query || route.query.q || "");
const results = computed(() => searchArticles(articles.value, query.value));
const page = computed(() => currentPage(route.query.page, results.value.length));
const visible = computed(() => pageItems(results.value, page.value));

onMounted(async () => {
  if (props.articles) return;
  articles.value = (await loadSite()).articles;
});
</script>

<template>
  <main class="page">
    <h1>搜索</h1>
    <form>
      <input name="q" :value="query" aria-label="搜索" />
      <button>搜索</button>
    </form>
    <p v-if="!String(query).trim()">请输入关键词</p>
    <p v-else-if="results.length === 0">没有找到相关文章</p>
    <ul v-else class="list">
      <li v-for="article in visible" :key="article.id">
        <RouterLink :to="`/articles/${article.id}`">{{ article.title }}</RouterLink>
      </li>
    </ul>
    <Pager :page="page" :page-count="pageCount(results.length)" />
  </main>
</template>
