import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import ArticlePage from "../src/pages/ArticlePage.vue";

const article = {
  id: "middle",
  title: "中间一篇",
  publishedOn: "2026-10-14",
  wordCount: 401,
  readingMinutes: 2,
  body: "正文第一段",
  headings: [{ text: "第一节", anchor: "第一节", level: 2 }],
  previous: { id: "newer", title: "更新的一篇" },
  next: { id: "older", title: "更旧的一篇" }
};

describe("article page", () => {
  test("shows reading details, contents, and both neighbors", () => {
    const wrapper = mount(ArticlePage, { props: { article } });

    expect(wrapper.text()).toContain("中间一篇");
    expect(wrapper.text()).toContain("2026-10-14");
    expect(wrapper.text()).toContain("401");
    expect(wrapper.text()).toContain("2 分钟");
    expect(wrapper.text()).toContain("正文第一段");
    expect(wrapper.get("a[href='#第一节']").text()).toBe("第一节");
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
});
