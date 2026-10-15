import { mountPage as mount } from "./mountPage.js";
import { describe, expect, test } from "vitest";
import AboutPage from "../src/pages/AboutPage.vue";
import HistoryPage from "../src/pages/HistoryPage.vue";

describe("about and history", () => {
  test("shows the author introduction without an article list", () => {
    const wrapper = mount(AboutPage, { props: { text: "我是作者" } });

    expect(wrapper.text()).toContain("我是作者");
    expect(wrapper.find("a[href^='/articles/']").exists()).toBe(false);
  });

  test("shows an empty about page without pretending it is an archive", () => {
    const wrapper = mount(AboutPage, { props: { text: "" } });

    expect(wrapper.text()).toContain("暂时没有内容");
    expect(wrapper.text()).not.toContain("共有");
  });

  test("keeps an unpublished history event without its article link", () => {
    const wrapper = mount(HistoryPage, {
      props: {
        events: [
          { date: "2026-10-14", text: "站点迁移", articleId: null },
          { date: "2026-10-13", text: "发布第一篇", articleId: "first" }
        ]
      }
    });

    expect(wrapper.text()).toContain("站点迁移");
    expect(wrapper.find("a[href='#/articles/gone']").exists()).toBe(false);
    expect(wrapper.get("a[href='#/articles/first']").exists()).toBe(true);
  });
});
