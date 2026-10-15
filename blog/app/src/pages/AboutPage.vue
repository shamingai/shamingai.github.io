<script setup>
import { onMounted, ref } from "vue";
import { loadSite } from "../services/site.js";

const props = defineProps({
  text: { type: String, default: null }
});
const text = ref(props.text ?? "");

onMounted(async () => {
  if (props.text !== null) return;
  text.value = (await loadSite()).about;
});
</script>

<template>
  <main class="page"><article class="panel">
    <h1>关于</h1>
    <p v-if="text.trim()">{{ text }}</p>
    <p v-else>暂时没有内容</p>
  </article></main>
</template>
