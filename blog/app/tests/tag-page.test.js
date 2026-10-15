import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import TagPage from "../src/pages/TagPage.vue";

describe("tag page", () => {
  test("links tags separately from categories", () => {
    const wrapper = mount(TagPage, {
      props: { tags: [{ name: "人工智能" }] }
    });

    expect(wrapper.get("a[href='#/tags/人工智能']").exists()).toBe(true);
    expect(wrapper.find("a[href='/categories/人工智能']").exists()).toBe(false);
  });

  test("lists articles using the selected tag", () => {
    const wrapper = mount(TagPage, {
      props: {
        tag: "模型",
        articles: [{ id: "both", title: "两个标签", category: "人工智能" }]
      }
    });

    expect(wrapper.get("a[href='#/articles/both']").text()).toBe("两个标签");
    expect(wrapper.text()).toContain("人工智能");
  });
});
