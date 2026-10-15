<script setup>
import { onMounted, ref } from "vue";
import { loadSite } from "../services/site.js";

const props = defineProps({
  events: { type: Array, default: null }
});
const events = ref(props.events ?? []);

onMounted(async () => {
  if (props.events) return;
  events.value = (await loadSite()).history;
});
</script>

<template>
  <main class="page">
    <h1>历史</h1>
    <p v-if="events.length === 0">暂时没有内容</p>
    <ol v-else class="list">
      <li v-for="event in events" :key="`${event.date}-${event.text}`">
        <time>{{ event.date }}</time>
        {{ event.text }}
        <RouterLink v-if="event.articleId" :to="`/articles/${event.articleId}`">查看文章</RouterLink>
      </li>
    </ol>
  </main>
</template>
