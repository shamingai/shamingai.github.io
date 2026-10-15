<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import { currentPage, pageCount, pageItems } from "../services/paging.js";
import { loadSite } from "../services/site.js";

const props = defineProps({
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { query: {} };
const articles = ref(props.articles ?? []);
const page = computed(() => currentPage(route.query.page, articles.value.length));
const visible = computed(() => pageItems(articles.value, page.value));

onMounted(async () => {
  if (props.articles) return;
  articles.value = (await loadSite()).articles;
});
</script>

<template>
  <section class="hero">
    <div>
      <p>卷又卷不起，躺又躺不平</p>
    </div>
  </section>
  <main class="page">
    <p v-if="articles.length === 0" class="panel">暂时没有文章</p>
    <ul v-else class="cards">
      <li v-for="article in visible" :key="article.id" class="card">
        <h2><RouterLink :to="`/articles/${article.id}`">{{ article.title }}</RouterLink></h2>
        <RouterLink :to="`/articles/${article.id}`">{{ article.summary || "暂无摘要" }}</RouterLink>
        <p class="meta">
          <time>{{ article.publishedOn }}</time>
          <RouterLink :to="`/categories/${article.category}`">{{ article.category }}</RouterLink>
        </p>
        <p class="tags">
          <RouterLink v-for="tag in article.tags" :key="tag" :to="`/tags/${tag}`">#{{ tag }}</RouterLink>
        </p>
      </li>
    </ul>
    <Pager :page="page" :page-count="pageCount(articles.length)" />
  </main>
</template>
