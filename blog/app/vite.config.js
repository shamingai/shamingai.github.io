import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function siteData() {
  return {
    name: "site-data",
    configureServer(server) {
      server.middlewares.use("/site-data.json", async (_request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.end(await readFile(new URL("../../site/site-data.json", import.meta.url)));
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), siteData()],
  server: { proxy: { "/api": "http://127.0.0.1:8080" } }
});
