<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import { currentPage, pageCount, pageItems } from "../services/paging.js";
import { loadSite } from "../services/site.js";

const props = defineProps({
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: null },
  years: { type: Array, default: null }
});
const route = useRoute() ?? { query: {} };
const total = ref(props.total ?? 0);
const years = ref(props.years ?? []);
const ordered = computed(() => years.value.flatMap((year) => year.articles.map((article) => ({ ...article, year: year.name }))));
const page = computed(() => currentPage(props.pageCount ? props.page : route.query.page, ordered.value.length));
const visible = computed(() => pageItems(ordered.value, page.value));

onMounted(async () => {
  if (props.years) return;
  const archive = (await loadSite()).archive;
  total.value = archive.total;
  pageCount.value = archive.pageCount;
  years.value = archive.years;
});
</script>

<template>
  <main class="page">
    <h1>归档</h1>
    <p>共有 {{ total }} 篇</p>
    <ul class="list">
      <li v-for="article in visible" :key="article.id" class="panel">
        <p class="meta">{{ article.year }}</p>
        <RouterLink :to="`/articles/${article.id}`">{{ article.title }}</RouterLink>
      </li>
    </ul>
    <Pager :page="page" :page-count="pageCount(ordered.length)" />
  </main>
</template>
