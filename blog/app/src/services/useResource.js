import { onMounted, ref } from "vue";

export function useResource(load) {
  const state = ref("loading");
  const data = ref(null);
  const error = ref("");
  let active = load;
  let latest = 0;

  async function reload() {
    if (!active) return;
    const ticket = ++latest;
    state.value = "loading";
    error.value = "";
    try {
      const value = await active();
      if (ticket !== latest) return;
      data.value = value;
      state.value = "ready";
    } catch (cause) {
      if (ticket !== latest) return;
      error.value = cause?.message || "加载失败";
      state.value = "error";
    }
  }

  onMounted(reload);

  return {
    state,
    data,
    error,
    reload,
    disable() {
      active = null;
      latest += 1;
      state.value = "ready";
    }
  };
}
