<script setup>
import { computed } from "vue";
import ResourceState from "../components/ResourceState.vue";
import { api } from "../services/api.js";
import { useResource } from "../services/useResource.js";

const props = defineProps({
  text: { type: String, default: null }
});
const injected = props.text !== null;
const resource = useResource(() => api.about().then((data) => data.about).catch(emptyOn404));
if (injected) resource.disable();
const text = computed(() => (injected ? props.text : resource.data.value ?? ""));

function emptyOn404(error) {
  if (error?.status === 404) return "";
  throw error;
}
</script>

<template>
  <main class="page"><article class="panel">
    <h1>关于</h1>
    <ResourceState :state="resource.state.value" :error="resource.error.value" @retry="resource.reload" />
    <template v-if="resource.state.value === 'ready'">
      <p v-if="text.trim()">{{ text }}</p>
      <p v-else>暂时没有内容</p>
    </template>
  </article></main>
</template>
