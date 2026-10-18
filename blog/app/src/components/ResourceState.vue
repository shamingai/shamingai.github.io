<script setup>
defineProps({
  state: { type: String, required: true },
  error: { type: String, default: "" }
});
defineEmits(["retry"]);
</script>

<template>
  <p v-if="state === 'loading'" class="status panel" role="status">加载中…</p>
  <div v-else-if="state === 'error'" class="status panel" role="alert">
    <p>加载失败：{{ error || "无法连接服务器" }}</p>
    <button type="button" @click="$emit('retry')">重试</button>
  </div>
</template>
