<script setup>
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { loadSite } from "../services/site.js";

const props = defineProps({
  article: { type: Object, default: undefined }
});
const route = useRoute() ?? { params: {} };
const article = ref(props.article === undefined ? undefined : props.article);
const activeHeading = ref("");

function blocks(body) {
  const result = [];
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    result.push({ type: "paragraph", text: paragraph.join("") });
    paragraph = [];
  };
  for (const line of String(body ?? "").split(/\n/)) {
    const heading = /^(#{2,6})\s+(\S.*?)\s*$/.exec(line);
    if (heading) {
      flush();
      result.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (line.trim()) {
      paragraph.push(line.trim());
    } else {
      flush();
    }
  }
  flush();
  return result;
}

async function load() {
  if (props.article !== undefined) return;
  const site = await loadSite();
  article.value = site.articles.find((item) => item.id === route.params.id) ?? null;
}

onMounted(() => {
  load();
  if (typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (visible) activeHeading.value = visible.target.id;
  }, { rootMargin: "-20% 0px -70% 0px" });
  watch(article, async () => {
    await nextTick();
    observer.disconnect();
    document.querySelectorAll(".prose h2, .prose h3").forEach((heading) => observer.observe(heading));
  }, { immediate: true });
});
watch(() => route.params.id, load);
</script>

<template>
  <p v-if="article === null" class="reading">文章不存在</p>
  <template v-else-if="article">
    <section class="article-hero">
      <h1>{{ article.title }}</h1>
      <p>{{ article.publishedOn }} · {{ article.wordCount }} 字 · {{ article.readingMinutes }} 分钟</p>
    </section>
    <main class="article-layout">
      <article class="prose panel">
        <template v-for="(block, index) in blocks(article.body)" :key="index">
          <component :is="`h${block.level}`" v-if="block.type === 'heading'" :id="block.text">{{ block.text }}</component>
          <p v-else>{{ block.text }}</p>
        </template>
        <p class="tags">
          <RouterLink :to="`/categories/${article.category}`">{{ article.category }}</RouterLink>
          <RouterLink v-for="tag in article.tags" :key="tag" :to="`/tags/${tag}`">#{{ tag }}</RouterLink>
        </p>
      </article>
      <aside v-if="article.headings.length" class="toc">
        <p>目录</p>
        <a
          v-for="heading in article.headings"
          :key="heading.anchor"
          :href="`#${heading.anchor}`"
          :class="[`level-${heading.level}`, { active: activeHeading === heading.text }]"
        >{{ heading.text }}</a>
      </aside>
      <nav class="neighbors">
        <RouterLink v-if="article.previous" :to="`/articles/${article.previous.id}`">{{ article.previous.title }}</RouterLink>
        <span v-else></span>
        <RouterLink v-if="article.next" :to="`/articles/${article.next.id}`">{{ article.next.title }}</RouterLink>
      </nav>
    </main>
  </template>
</template>
