import "./style.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router.js";

// Register the router before mounting.
// Source: https://router.vuejs.org/guide/#registering-the-router-plugin
const app = createApp(App);
app.use(router);
app.mount("#app");
