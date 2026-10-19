import { mountPage as mount } from "./mountPage.js";
import { flushPromises } from "@vue/test-utils";

import { afterEach, describe, expect, test, vi } from "vitest";
import ArticlePage from "../src/pages/ArticlePage.vue";

const article = {
  id: "middle",
  title: "中间一篇",
  publishedOn: "2026-10-14",
  wordCount: 401,
  readingMinutes: 2,
  body: "正文第一段\n\n## 第一节\n\n第二节正文\n\n## 2. HRV：被量化的心跳\n\n第三节正文",
  headings: [
    { text: "第一节", anchor: "第一节", level: 2 },
    { text: "2. HRV：被量化的心跳", anchor: "2-hrv-被量化的心跳", level: 2 }
  ],
  tags: ["资讯"],
  previous: { id: "newer", title: "更新的一篇" },
  next: { id: "older", title: "更旧的一篇" }
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("article page", () => {
  test("shows reading details, contents, and both neighbors", () => {
    const wrapper = mount(ArticlePage, { props: { article } });

    expect(wrapper.text()).toContain("中间一篇");
    expect(wrapper.text()).toContain("2026-10-14");
    expect(wrapper.text()).toContain("401");
    expect(wrapper.text()).toContain("2 分钟");
    expect(wrapper.text()).toContain("正文第一段");
    expect(wrapper.get("a[href='##第一节']").text()).toBe("第一节");
    expect(wrapper.get("a[href='#/articles/newer']").text()).toContain("更新的一篇");
    expect(wrapper.get("a[href='#/articles/older']").text()).toContain("更旧的一篇");
  });

  test("omits an empty contents list and a missing neighbor", () => {
    const wrapper = mount(ArticlePage, {
      props: { article: { ...article, headings: [], previous: null } }
    });

    expect(wrapper.find("aside").exists()).toBe(false);
    expect(wrapper.find("a[href='#/articles/newer']").exists()).toBe(false);
    expect(wrapper.get("a[href='#/articles/older']").exists()).toBe(true);
  });

  test("shows a missing article without its body", () => {
    const wrapper = mount(ArticlePage, { props: { article: null } });

    expect(wrapper.text()).toContain("文章不存在");
    expect(wrapper.text()).not.toContain("正文第一段");
  });

  test("uses slug anchors for body headings instead of raw titles", () => {
    const wrapper = mount(ArticlePage, { props: { article } });

    expect(wrapper.find("h2[id='第一节']").exists()).toBe(true);
    expect(wrapper.find("h2[id='2-hrv-被量化的心跳']").exists()).toBe(true);
    expect(wrapper.find("h2[id='2. HRV：被量化的心跳']").exists()).toBe(false);
  });

  test("clicking a contents item scrolls to the heading without touching the route", async () => {
    const wrapper = mount(ArticlePage, { props: { article }, attachTo: document.body });
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    await flushPromises();
    const target = document.getElementById("2-hrv-被量化的心跳");
    const scrollIntoView = vi.fn();
    expect(target).not.toBeNull();
    target.scrollIntoView = scrollIntoView;

    await wrapper.get("a[href='##2-hrv-被量化的心跳']").trigger("click");

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(replaceState).toHaveBeenCalledWith(null, "", "#2-hrv-被量化的心跳");
    wrapper.unmount();
  });

  test("disconnects the observer when the page unmounts", async () => {
    const disconnect = vi.fn();
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor() {
        this.disconnect = disconnect;
        this.observe = vi.fn();
      }
    };
    try {
      const wrapper = mount(ArticlePage, { props: { article } });
      await flushPromises();
      expect(disconnect).toHaveBeenCalled();
      const before = disconnect.mock.calls.length;
      wrapper.unmount();
      expect(disconnect.mock.calls.length).toBe(before + 1);
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });
});
