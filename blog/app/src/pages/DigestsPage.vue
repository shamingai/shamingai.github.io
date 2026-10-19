<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Pager from "../components/Pager.vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useListing, useReloadOnQuery } from "../services/paging.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  digests: { type: Array, default: null },
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageCount: { type: Number, default: null }
});
const route = useRoute() ?? { query: {} };
const injected = ref(props.digests !== null);
const resource = useResource(() => api.digests(route.query));
if (injected.value) resource.disable();
useReloadOnQuery(route, resource, ["page"]);

const digests = computed(() => (injected.value ? props.digests : resource.data.value?.items ?? []));
const total = computed(() => props.total ?? resource.data.value?.total ?? digests.value.length);
const { page, count, visible } = useListing(route, {
  injected,
  data: resource.data,
  items: digests,
  injectedPage: computed(() => (props.pageCount ? props.page : route.query.page))
});
</script>

<template>
  <main class="page">
    <h1>每日资讯</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p v-if="digests.length === 0" class="panel">暂时没有资讯</p>
      <template v-else>
        <p>共有 {{ total }} 期</p>
        <ul class="cards">
          <li v-for="digest in visible" :key="digest.date" class="card">
            <p class="meta">
              <time>{{ digest.date }}</time>
              <span>{{ digest.item_count }} 条</span>
            </p>
            <h2><RouterLink :to="`/digests/${digest.date}`">{{ digest.title }}</RouterLink></h2>
          </li>
        </ul>
        <Pager :page="page" :page-count="count" />
      </template>
    </template>
  </main>
</template>
