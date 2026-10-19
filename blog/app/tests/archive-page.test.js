import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import ArchivePage from "../src/pages/ArchivePage.vue";

describe("archive page", () => {
  test("shows the total, year groups, and next page", () => {
    const wrapper = mount(ArchivePage, {
      props: {
        total: 45,
        page: 1,
        pageCount: 5,
        years: [{ name: "2026", articles: [{ id: "new", title: "新文章" }] }]
      }
    });

    expect(wrapper.text()).toContain("45 篇");
    expect(wrapper.text()).toContain("2026");
    expect(wrapper.get("a[href='#/articles/new']").text()).toBe("新文章");
    expect(wrapper.text()).toContain("2");
  });

  test("does not show pagination for a single page", () => {
    const wrapper = mount(ArchivePage, {
      props: { total: 1, page: 1, pageCount: 1, years: [] }
    });

    expect(wrapper.find(".pager").exists()).toBe(false);
  });
});
