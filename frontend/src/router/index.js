import { createRouter, createWebHistory } from "vue-router";
import EmptyView from "@/views/EmptyView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: EmptyView // the base app component already contains the home page
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
			path: "/events",
			name: "events",
			component: () => import('../views/EventsView.vue'),
		},
		{
			path: "/settings",
			name: "settings-parent",
			component: () => import('../views/SettingsView.vue'),
			children: [
				{
					path: '',
					name: 'settings',
					component: EmptyView,
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
