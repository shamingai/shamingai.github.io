import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import ArticlePage from "./pages/ArticlePage.vue";
import ArchivePage from "./pages/ArchivePage.vue";
import CategoryPage from "./pages/CategoryPage.vue";
import TagPage from "./pages/TagPage.vue";
import SearchPage from "./pages/SearchPage.vue";
import AboutPage from "./pages/AboutPage.vue";
import HistoryPage from "./pages/HistoryPage.vue";
import DigestsPage from "./pages/DigestsPage.vue";
import DigestPage from "./pages/DigestPage.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/articles/:id", component: ArticlePage },
    { path: "/archive", component: ArchivePage },
    { path: "/categories", component: CategoryPage },
    { path: "/categories/:name", component: CategoryPage },
    { path: "/tags", component: TagPage },
    { path: "/tags/:name", component: TagPage },
    { path: "/search", component: SearchPage },
    { path: "/about", component: AboutPage },
    { path: "/history", component: HistoryPage },
    { path: "/digests", component: DigestsPage },
    { path: "/digests/:date", component: DigestPage }
  ]
});
