<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  page: { type: Number, required: true },
  pageCount: { type: Number, required: true }
});
const route = useRoute();
const router = useRouter();
const pages = computed(() => Array.from({ length: props.pageCount }, (_, index) => index + 1));

function open(page) {
  router.push({ query: { ...route.query, page: page === 1 ? undefined : String(page) } });
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pager" aria-label="分页">
    <button type="button" :disabled="page === 1" @click="open(page - 1)">上一页</button>
    <button
      v-for="index in pages"
      :key="index"
      type="button"
      :aria-current="index === page ? 'page' : undefined"
      @click="open(index)"
    >{{ index }}</button>
    <button type="button" :disabled="page === pageCount" @click="open(page + 1)">下一页</button>
  </nav>
</template>
