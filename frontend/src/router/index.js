import { createRouter, createWebHistory } from "vue-router";
import { h } from "vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: h("div"), // this is just a dummy, will never be displayed
		},
		{
			path: "/schedule",
			name: "schedule",
			component: h("div"), // this is just a dummy, will never be displayed
		},
		{
			path: "/settings",
			name: "settings",
			component: h("div"), // this is just a dummy, will never be displayed
		},
	],
});

export default router;
