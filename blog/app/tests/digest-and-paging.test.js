import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { RouterLinkStub } from "./mountPage.js";
import HomePage from "../src/pages/HomePage.vue";
import DigestsPage from "../src/pages/DigestsPage.vue";
import DigestPage from "../src/pages/DigestPage.vue";
import TagPage from "../src/pages/TagPage.vue";

async function mountAt(component, path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: HomePage },
      { path: "/digests", component: DigestsPage },
      { path: "/digests/:date", component: DigestPage },
      { path: "/tags/:name", component: TagPage }
    ]
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount(component, {
    global: {
      plugins: [router],
      stubs: { RouterLink: RouterLinkStub, "router-link": RouterLinkStub }
    }
  });
  await flushPromises();
  return { wrapper, router };
}

function json(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("digest pages", () => {
  test("lists digests from the server with paging", async () => {
    const fetchMock = vi.fn(() => json({ items: [{ date: "2026-10-18", title: "2026 年 10 月 18 日资讯", item_count: 10 }], total: 25, page: 2, page_size: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    const { wrapper } = await mountAt(DigestsPage, "/digests?page=2");

    expect(fetchMock.mock.calls[0][0]).toContain("/api/digests?");
    expect(fetchMock.mock.calls[0][0]).toContain("page=2");
    expect(wrapper.text()).toContain("共有 25 期");
    expect(wrapper.get("a[href='#/digests/2026-10-18']").text()).toContain("资讯");
    expect(wrapper.find(".pager").exists()).toBe(true);
    expect(wrapper.text()).toContain("3");
  });

  test("builds request URLs on https://api.zhaotong.fun for the production build", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.zhaotong.fun");
    const fetchMock = vi.fn(() => json({ items: [], total: 0, page: 1, page_size: 10 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { api } = await import("../src/services/api.js");
      await api.digests({ page: 2 });
      await api.post("rec-001");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.zhaotong.fun/api/digests?page_size=10&page=2");
      expect(fetchMock.mock.calls[1][0]).toBe("https://api.zhaotong.fun/api/posts/rec-001");
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  test("shows rank, reason, and the external link of every item", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({
      date: "2026-10-18",
      title: "2026 年 10 月 18 日资讯",
      item_count: 2,
      note: "今日无重复条目",
      generated_at: "2026-10-18T00:05:00Z",
      items: [
        { rank: 1, url: "https://example.com/a", title: "甲条", site_name: "某站", site_rank: 1, mention_count: 2, summary: "摘要一", reason: "理由一" },
        { rank: 2, url: "https://example.com/b", title: "乙条", site_name: "另站", site_rank: null, mention_count: 1, summary: "", reason: "理由二" }
      ]
    })));

    const { wrapper } = await mountAt(DigestPage, "/digests/2026-10-18");

    expect(wrapper.text()).toContain("2026 年 10 月 18 日资讯");
    expect(wrapper.text()).toContain("今日无重复条目");
    expect(wrapper.text()).toContain("第 1 名");
    expect(wrapper.text()).toContain("某站 第 1 名");
    expect(wrapper.text()).toContain("被 2 次提及");
    expect(wrapper.text()).toContain("推荐理由：理由一");
    expect(wrapper.get("a[href='https://example.com/a']").text()).toBe("甲条");
    expect(wrapper.get("a[href='https://example.com/b']").text()).toBe("乙条");
  });

  test("tells an empty day apart from a server error", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({ error: { code: "digest_not_found", message: "没有这一天的资讯" } }, 404)));
    const missing = await mountAt(DigestPage, "/digests/2026-10-01");
    expect(missing.wrapper.text()).toContain("这一天没有资讯");
    expect(missing.wrapper.find("[role='alert']").exists()).toBe(false);

    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn(() => json({ error: { code: "internal", message: "数据库不可用" } }, 500)));
    const failed = await mountAt(DigestPage, "/digests/2026-10-02");
    expect(failed.wrapper.text()).toContain("加载失败：数据库不可用");
    expect(failed.wrapper.text()).not.toContain("这一天没有资讯");
    expect(failed.wrapper.get("button").text()).toBe("重试");
  });

  test("a failed reload replaces the old digest instead of showing it beside the error", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        json({
          date: "2026-10-18",
          title: "2026 年 10 月 18 日资讯",
          item_count: 2,
          items: [
            { rank: 1, url: "https://example.com/a", title: "甲条" },
            { rank: 2, url: "https://example.com/b", title: "乙条" }
          ]
        })
      )
      .mockImplementationOnce(() => json({ error: { code: "internal", message: "数据库不可用" } }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const { wrapper } = await mountAt(DigestPage, "/digests/2026-10-18");
    expect(wrapper.text()).toContain("甲条");

    const { reload } = wrapper.vm.$.setupState.resource;
    await reload();
    await flushPromises();

    expect(wrapper.text()).toContain("加载失败：数据库不可用");
    expect(wrapper.text()).not.toContain("甲条");
    expect(wrapper.text()).not.toContain("这一天没有资讯");
  });
});

describe("server paging", () => {
  test("home fetches the page from the query string instead of slicing locally", async () => {
    const fetchMock = vi.fn(() => json({ items: [{ slug: "s-11", title: "第十一篇", published_on: "2026-10-01", tags: [] }], total: 30, page: 2, page_size: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    const { wrapper } = await mountAt(HomePage, "/?page=2");

    expect(fetchMock.mock.calls[0][0]).toContain("page=2");
    expect(fetchMock.mock.calls[0][0]).toContain("page_size=10");
    expect(wrapper.get("a[href='#/articles/s-11']").text()).toBe("第十一篇");
    const pager = wrapper.get(".pager");
    expect(pager.get("button[aria-current='page']").text()).toBe("2");
    expect(pager.findAll("button").map((button) => button.text())).toContain("3");
  });

  test("tag and category pages request the next page from the server", async () => {
    const fetchMock = vi.fn(() => json({ items: [{ slug: "x", title: "标签文章", category_path: "人工智能" }], total: 12, page: 2, page_size: 10 }));
    vi.stubGlobal("fetch", fetchMock);

    await mountAt(TagPage, "/tags/资讯?page=2");

    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toContain("/api/tags/资讯/posts?");
    expect(fetchMock.mock.calls[0][0]).toContain("page=2");
  });

  test("clicking next page reloads the next slice from the server", async () => {
    const fetchMock = vi.fn((url) =>
      url.includes("page=2")
        ? json({ items: [{ slug: "s-21", title: "第二十一篇", published_on: "2026-09-01", tags: [] }], total: 35, page: 2, page_size: 10 })
        : json({ items: [{ slug: "s-11", title: "第十一篇", published_on: "2026-10-01", tags: [] }], total: 35, page: 1, page_size: 10 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { wrapper, router } = await mountAt(HomePage, "/?page=1");
    expect(wrapper.text()).toContain("第十一篇");

    await wrapper.get(".pager button:last-child").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query.page).toBe("2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
    expect(wrapper.text()).toContain("第二十一篇");
    expect(wrapper.text()).not.toContain("第十一篇");

    await wrapper.get(".pager button:first-child").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query.page).toBeUndefined();
    expect(wrapper.text()).toContain("第十一篇");
  });
});

describe("home page with digests from the server", () => {
  test("keeps digest and post cards together on the same day and uses the server page count", async () => {
    const fetchMock = vi.fn(() => json({
      items: [
        { slug: "daily-2026-10-18", kind: "digest", title: "10 月 18 日资讯", summary: "前十", category_path: "资讯", published_on: "2026-10-18", tags: [] },
        { slug: "rec-001", kind: "post", title: "推荐系统入门", summary: "第一课", category_path: "技术 / 推荐系统", published_on: "2026-10-17", tags: ["推荐"] }
      ],
      total: 40,
      page: 1,
      page_size: 10,
      page_count: 4
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { wrapper } = await mountAt(HomePage, "/");

    expect(fetchMock.mock.calls[0][0]).toContain("/api/posts?");
    expect(wrapper.findAll("li.card")).toHaveLength(2);
    expect(wrapper.get("li.card.digest .badge").text()).toBe("资讯");
    expect(wrapper.findAll(".day-title").map((title) => title.text())).toEqual(["2026-10-18", "2026-10-17"]);
    expect(wrapper.findAll(".pager button").map((button) => button.text())).toEqual(["上一页", "1", "2", "3", "4", "下一页"]);
  });

  test("falls back to total / page_size when the server omits page_count", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({ items: [{ slug: "a", title: "甲", published_on: "2026-10-01", tags: [] }], total: 25, page: 1, page_size: 10 })));

    const { wrapper } = await mountAt(HomePage, "/");

    expect(wrapper.findAll(".pager button").map((button) => button.text())).toContain("3");
  });
});
