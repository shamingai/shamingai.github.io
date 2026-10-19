<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  digest: { type: Object, default: null }
});
const route = useRoute() ?? { params: {} };
const injected = ref(props.digest !== null);
const resource = useResource(() => api.digest(route.params.date).catch(notFoundAsNull));
if (injected.value) resource.disable();

function notFoundAsNull(error) {
  if (error?.status === 404) return null;
  throw error;
}

const digest = computed(() => (injected.value ? props.digest : resource.data.value));
const items = computed(() => digest.value?.items ?? []);

function sourceLabel(item) {
  if (!item.site_name) return "";
  return item.site_rank ? `${item.site_name} 第 ${item.site_rank} 名` : item.site_name;
}
</script>

<template>
  <main class="page">
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p v-if="!digest" class="panel">这一天没有资讯</p>
      <template v-else>
        <h1>{{ digest.title }}</h1>
        <p class="meta">
          <time>{{ digest.date }}</time>
          <span>{{ digest.item_count }} 条</span>
          <span>更新时间 {{ digest.generated_at }}</span>
        </p>
        <p v-if="digest.note" class="panel">{{ digest.note }}</p>
        <ol class="cards">
          <li v-for="item in items" :key="item.url" class="card">
            <p class="meta">
              <span>第 {{ item.rank }} 名</span>
              <span v-if="sourceLabel(item)">{{ sourceLabel(item) }}</span>
              <span v-if="item.mention_count > 1">被 {{ item.mention_count }} 次提及</span>
            </p>
            <h2><a :href="item.url" rel="noopener noreferrer" target="_blank">{{ item.title }}</a></h2>
            <p v-if="item.summary">{{ item.summary }}</p>
            <p v-if="item.reason" class="reason">推荐理由：{{ item.reason }}</p>
            <p class="meta">
              <a :href="item.url" rel="noopener noreferrer" target="_blank">阅读原文</a>
            </p>
          </li>
        </ol>
      </template>
    </template>
  </main>
</template>
