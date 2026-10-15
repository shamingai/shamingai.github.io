import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import HomePage from "../src/pages/HomePage.vue";

const articles = [
  {
    id: "new",
    title: "新文章",
    summary: "这是摘要",
    category: "人工智能",
    tags: ["模型", "实践"],
    publishedOn: "2026-10-14"
  },
  {
    id: "blank",
    title: "无摘要",
    summary: "",
    category: "深度学习",
    tags: [],
    publishedOn: "2026-10-13"
  }
];

describe("home page", () => {
  test("shows title, summary, one category, all tags, and an article link", () => {
    const wrapper = mount(HomePage, { props: { articles } });

    expect(wrapper.text()).toContain("新文章");
    expect(wrapper.text()).toContain("这是摘要");
    expect(wrapper.text()).toContain("人工智能");
    expect(wrapper.text()).toContain("模型");
    expect(wrapper.text()).toContain("实践");
    expect(wrapper.get("a[href='#/articles/new']").exists()).toBe(true);
  });

  test("shows a visible empty summary instead of article body", () => {
    const wrapper = mount(HomePage, { props: { articles } });

    expect(wrapper.text()).toContain("暂无摘要");
  });

  test("shows an empty state when nothing is published", () => {
    const wrapper = mount(HomePage, { props: { articles: [] } });

    expect(wrapper.text()).toContain("暂时没有文章");
  });
});
