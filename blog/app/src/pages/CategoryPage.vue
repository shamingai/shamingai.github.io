<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Pager from "../components/Pager.vue";
import { currentPage, pageCount, pageItems } from "../services/paging.js";
import { useRoute } from "vue-router";
import { loadSite } from "../services/site.js";

const props = defineProps({
  categories: { type: Array, default: null },
  category: { type: String, default: "" },
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { params: {}, query: {} };
const categories = ref(props.categories ?? []);
const articles = ref(props.articles ?? []);
const page = computed(() => currentPage(route.query.page, articles.value.length));
const visibleArticles = computed(() => pageItems(articles.value, page.value));
const category = ref(props.category);

async function load() {
  if (props.categories || props.articles) return;
  const site = await loadSite();
  const name = route.params.name;
  category.value = name ?? "";
  categories.value = name ? [] : site.categories;
  articles.value = name ? site.categories.find((item) => item.name === name)?.articles ?? [] : [];
}

onMounted(load);
watch(() => route.params.name, load);
</script>

<template>
  <main class="page">
    <h1>{{ category || "分类" }}</h1>
    <ul v-if="categories.length" class="list">
      <li v-for="item in categories" :key="item.name">
        <RouterLink :to="`/categories/${item.name}`">{{ item.name }} · {{ item.articleCount }}</RouterLink>
      </li>
    </ul>
    <p v-else-if="articles.length === 0">暂时没有文章</p>
    <ul v-else class="list">
      <li v-for="article in visibleArticles" :key="article.id">
        <RouterLink :to="`/articles/${article.id}`">{{ article.title }}</RouterLink>
      </li>
    </ul>
    <Pager v-if="!categories.length" :page="page" :page-count="pageCount(articles.length)" />
  </main>
</template>
