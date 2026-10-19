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

describe("home page mixing digests with posts", () => {
  const mixed = [
    { slug: "daily-2026-10-18", kind: "digest", title: "2026 年 10 月 18 日资讯", summary: "今日热门前十", category: "资讯", tags: [], published_on: "2026-10-18" },
    { slug: "rec-001", kind: "post", title: "推荐系统入门", summary: "第一课", category: "技术 / 推荐系统", tags: ["推荐"], published_on: "2026-10-17" },
    { slug: "life-001", kind: "post", title: "周末散步", summary: "河边", category: "生活", tags: [], published_on: "2026-10-17" }
  ];

  test("shows digests and posts of the same day together", () => {
    const wrapper = mount(HomePage, { props: { articles: mixed } });
    const sameDay = wrapper.findAll("section.day").find((day) => day.get(".day-title").text() === "2026-10-17");

    expect(sameDay.findAll("li.card").map((card) => card.get("h3 a").text())).toEqual(["推荐系统入门", "周末散步"]);
    expect(wrapper.text()).toContain("2026 年 10 月 18 日资讯");
  });

  test("marks digest cards with their own class and badge", () => {
    const wrapper = mount(HomePage, { props: { articles: mixed } });
    const digestCard = wrapper.get("li.card.digest");
    expect(digestCard.get(".badge").text()).toBe("资讯");
    expect(digestCard.get("a[href='#/articles/daily-2026-10-18']").text()).toBe("2026 年 10 月 18 日资讯");
    expect(wrapper.findAll("li.card.digest")).toHaveLength(1);
    expect(wrapper.findAll(".badge")).toHaveLength(1);
  });

  test("groups cards by date in the order the server returned them", () => {
    const wrapper = mount(HomePage, { props: { articles: mixed } });

    expect(wrapper.findAll(".day-title").map((title) => title.text())).toEqual(["2026-10-18", "2026-10-17"]);
    expect(wrapper.find(".badge").exists()).toBe(true);
  });

  test("cards use h3 so the date heading stays the section title", () => {
    const wrapper = mount(HomePage, { props: { articles: mixed } });

    expect(wrapper.findAll("li.card h2")).toHaveLength(0);
    expect(wrapper.findAll("li.card h3")).toHaveLength(3);
  });

  test("keeps the injected page slice when a page prop is given", () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ id: `p-${index}`, title: `第${index}篇`, summary: "", category: "技术", tags: [], publishedOn: "2026-10-01" }));
    const wrapper = mount(HomePage, { props: { articles: many } });

    expect(wrapper.findAll("li.card")).toHaveLength(10);
  });
});
