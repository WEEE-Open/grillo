import { createRouter, createWebHistory } from "vue-router";
import { h } from "vue";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView
		},
		{
			path: "/schedule",
			name: "schedule",
			component: () => import('../views/ScheduleView.vue'),
		},
		{
			path: "/logs",
			name: "logs",
			component: () => import('../views/LogsView.vue'),
		},
		{
			path: "/settings",
			name: "settings-parent",
			component: () => import('../views/SettingsView.vue'),
			children: [
				{
					path: '',
					name: 'settings',
					component: h("div"), // this is just a dummy, will never be displayed
				},
				{
					path: 'locations',
					name: 'locations',
					component: () => import('../views/SettingsTabs/LocationsView.vue'),
				},
				{
					path: 'tokens',
					name: 'tokens',
					component: () => import('../views/SettingsTabs/TokensView.vue'),
				}
			]
		},
	],
});

export default router;
