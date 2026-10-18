<script setup>
import { computed } from "vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  events: { type: Array, default: null }
});
const injected = props.events !== null;
const resource = useResource(() => api.history().then((data) => data.items));
if (injected) resource.disable();
const events = computed(() => (injected ? props.events : resource.data.value ?? []));
</script>

<template>
  <main class="page">
    <h1>历史</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p v-if="events.length === 0">暂时没有内容</p>
      <ol v-else class="list">
        <li v-for="event in events" :key="`${event.date}-${event.text}`">
          <time>{{ event.date }}</time>
          {{ event.text }}
          <RouterLink v-if="event.articleId" :to="`/articles/${event.articleId}`">查看文章</RouterLink>
        </li>
      </ol>
    </template>
  </main>
</template>
