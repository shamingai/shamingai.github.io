<script setup>
import { computed, onMounted, ref, watch } from "vue";
import Pager from "../components/Pager.vue";
import { currentPage, pageCount, pageItems } from "../services/paging.js";
import { useRoute } from "vue-router";
import { loadSite } from "../services/site.js";

const props = defineProps({
  tags: { type: Array, default: null },
  tag: { type: String, default: "" },
  articles: { type: Array, default: null }
});
const route = useRoute() ?? { params: {}, query: {} };
const tags = ref(props.tags ?? []);
const articles = ref(props.articles ?? []);
const page = computed(() => currentPage(route.query.page, articles.value.length));
const visibleArticles = computed(() => pageItems(articles.value, page.value));
const tag = ref(props.tag);

async function load() {
  if (props.tags || props.articles) return;
  const site = await loadSite();
  const name = route.params.name;
  tag.value = name ?? "";
  tags.value = name ? [] : site.tags;
  articles.value = name ? site.tags.find((item) => item.name === name)?.articles ?? [] : [];
}

onMounted(load);
watch(() => route.params.name, load);
</script>

<template>
  <main class="page">
    <h1>{{ tag || "标签" }}</h1>
    <ul v-if="tags.length" class="list">
      <li v-for="item in tags" :key="item.name">
        <RouterLink :to="`/tags/${item.name}`">{{ item.name }}</RouterLink>
      </li>
    </ul>
    <ul v-else class="list">
      <li v-for="article in visibleArticles" :key="article.id">
        <RouterLink :to="`/articles/${article.id}`">{{ article.title }}</RouterLink>
        <p>{{ article.category }}</p>
      </li>
    </ul>
    <Pager v-if="!tags.length" :page="page" :page-count="pageCount(articles.length)" />
  </main>
</template>
