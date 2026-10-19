import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./build.js";

export function parseArgs(argv) {
  const contentDir = argv[0];
  const outputDir = argv[1];
  if (!contentDir || !outputDir) {
    throw new Error("usage: node src/cli.js <content-dir> <output-dir>");
  }
  return { contentDir, outputDir };
}

export async function postsFromDirectory(directory) {
  const names = (await readdir(directory)).filter((name) => name.endsWith(".md")).sort();
  return Promise.all(names.map(async (name) => {
    const fullPath = path.join(directory, name);
    const info = await stat(fullPath);
    const [title, ...rest] = (await readFile(fullPath, "utf8")).split(/\r?\n/);
    const body = rest.join("\n").trim();
    return {
      id: name.replace(/\.md$/, ""),
      title: title.trim(),
      summary: body.replace(/^#+\s+/gm, "").split(/\n\n/)[0]?.slice(0, 120) ?? "",
      body,
      category: "规格驱动开发",
      tags: ["规格驱动开发", "码云"],
      publishedOn: info.mtime.toISOString().slice(0, 10)
    };
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { contentDir, outputDir } = parseArgs(process.argv.slice(2));
  const content = JSON.parse(await readFile(contentDir, "utf8"));
  const posts = await postsFromDirectory(fileURLToPath(new URL("../../content/posts", import.meta.url)));
  content.articles = [...posts, ...content.articles];
  const result = await buildSite(content, outputDir);
  console.log(`${result.files.length} files, ${result.rejections.length} rejected`);
}
