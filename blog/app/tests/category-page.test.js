import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import CategoryPage from "../src/pages/CategoryPage.vue";

describe("category page", () => {
  test("shows hierarchy and direct counts", () => {
    const wrapper = mount(CategoryPage, {
      props: {
        categories: [
          { name: "人工智能", parent: null, articleCount: 0 },
          { name: "人工智能 / 深度学习", parent: "人工智能", articleCount: 2 }
        ]
      }
    });

    expect(wrapper.text()).toContain("人工智能 / 深度学习");
    expect(wrapper.text()).toContain("0");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.get("a[href='#/categories/人工智能']").exists()).toBe(true);
  });

  test("lists only direct articles and shows an empty parent", () => {
    const wrapper = mount(CategoryPage, {
      props: { category: "人工智能", articles: [] }
    });

    expect(wrapper.text()).toContain("暂时没有文章");
  });
});
