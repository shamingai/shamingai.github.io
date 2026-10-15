import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildSite } from "../src/build.js";

function article(index) {
  const year = index < 20 ? "2025" : "2026";
  return {
    id: `a${index}`,
    title: index === 21 ? "甲" : `文章${index}`,
    summary: index === 1 ? "独特摘要" : "摘要",
    body: index === 2 ? "## 第一节\n\n独特正文" : "正文",
    category: index === 3 ? "人工智能 / 深度学习" : "人工智能",
    tags: index === 4 ? ["模型", "实践"] : ["模型"],
    publishedOn: index === 21 ? "2026-10-14" : `${year}-01-${String(index + 1).padStart(2, "0")}`
  };
}

test("builds a static site without an admin entry", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "blog-site-"));
  try {
    const articles = Array.from({ length: 45 }, (_, index) => article(index));
    articles.push({ id: "same-day", title: "乙", summary: "摘要", body: "正文", category: "人工智能", tags: [], publishedOn: "2026-10-14" });
    const result = await buildSite({
      articles: [
        ...articles,
        { id: "empty", title: "空", body: "", category: "人工智能", publishedOn: "2026-10-14" },
        { id: "two", title: "两个分类", body: "正文", category: ["人工智能", "深度学习"], publishedOn: "2026-10-14" }
      ],
      about: "我是作者",
      history: [{ date: "2026-10-14", text: "站点迁移", articleId: "empty" }]
    }, outputDir);

    const home = await readFile(path.join(outputDir, "index.html"), "utf8");
    const archive = await readFile(path.join(outputDir, "archive/index.html"), "utf8");
    const parent = await readFile(path.join(outputDir, "categories/人工智能.html"), "utf8");
    const history = await readFile(path.join(outputDir, "history/index.html"), "utf8");
    assert.equal(home.indexOf("甲") < home.indexOf("乙"), true);
    assert.match(archive, /共有 46 篇/);
    assert.doesNotMatch(parent, /人工智能 \/ 深度学习/);
    assert.match(history, /站点迁移/);
    assert.doesNotMatch(history, /href="\/articles\/empty"/);
    assert.deepEqual(result.rejections.map((item) => item.id), ["empty", "two"]);
    for (const name of result.files.filter((file) => file.endsWith(".html"))) {
      const html = await readFile(path.join(outputDir, name), "utf8");
      assert.doesNotMatch(html, /在线编辑|管理后台|上传入口/);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
