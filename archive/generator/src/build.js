import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { publishArticles } from "./rules/publish.js";
import { neighborsFor, renderArticle } from "./render/article.js";
import { renderHome } from "./render/home.js";
import { archivePages } from "./rules/archive.js";
import { renderArchive } from "./render/archive.js";
import { renderCategory, renderCategoryIndex } from "./render/categories.js";
import { categoryCounts } from "./rules/categories.js";
import { renderTag, renderTagIndex } from "./render/tags.js";
import { usedTags } from "./rules/tags.js";
import { renderAbout } from "./render/about.js";
import { renderHistory } from "./render/history.js";
import { searchData } from "./render/search-data.js";
import { siteData } from "./render/site-data.js";
import { renderSearchPage, renderSearchScript } from "./render/search-page.js";

const forbidden = ["在线编辑", "管理后台", "上传入口"];

export async function buildSite(content, outputDir) {
  const { articles, rejections } = publishArticles(content.articles ?? []);
  await mkdir(outputDir, { recursive: true });
  const files = new Map();
  files.set("index.html", renderHome(articles));
  for (const article of articles) {
    files.set(`articles/${article.id}.html`, renderArticle(article, neighborsFor(article, articles)));
  }
  const archive = archivePages(articles);
  archive.pages.forEach((_, index) => {
    files.set(`archive/page/${index + 1}.html`, renderArchive(articles, index + 1));
  });
  files.set("archive/index.html", renderArchive(articles, 1));
  files.set("categories/index.html", renderCategoryIndex(articles));
  for (const category of categoryCounts(articles)) {
    files.set(`categories/${category.name}.html`, renderCategory(articles, category.name));
  }
  files.set("tags/index.html", renderTagIndex(articles));
  for (const tag of usedTags(articles)) {
    files.set(`tags/${tag.name}.html`, renderTag(articles, tag.name));
  }
  files.set("search-data.json", JSON.stringify(searchData(articles)));
  files.set("site-data.json", JSON.stringify(siteData(articles, content)));
  files.set("search/index.html", renderSearchPage());
  files.set("search.js", renderSearchScript());
  files.set("about/index.html", renderAbout(content.about ?? ""));
  files.set("history/index.html", renderHistory(content.history ?? [], new Set(articles.map((article) => article.id))));
  files.set("rejections.json", JSON.stringify(rejections));

  for (const [name, value] of files) {
    if (name.endsWith(".html") && forbidden.some((word) => value.includes(word))) {
      throw new Error(`forbidden entry in ${name}`);
    }
    const target = path.join(outputDir, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, value);
  }
  return { files: [...files.keys()], rejections };
}
