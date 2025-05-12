import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useServer = defineStore("server", {
	state: () => ({
		initiated: false,
		valid: false,
		blocked: false,
		username: null,
	}),
	actions: {
		makeRequest(method, path, body = null) {
			let abort = new AbortController();
			let headers = {};
			if (body) {
				headers["Content-Type"] = "application/json";
				body = JSON.stringify(body);
			}
			let request = fetch("/api/v1" + path, {
				method,
				headers,
				body,
				signal: abort.signal,
			});
			return [request, abort];
		},
		async init() {
			await this.verifySession();
			this.initiated = true;
		},
		async verifySession() {
			let [request, abort] = this.makeRequest("GET", "/user");
			let response = await request;
			let body = await response.json();
			if (response.ok) {
				// user logged in
				this.username = body.username;
				this.valid = true;
				this.blocked = false;
				this.initiated = true;
			} else if (response.status === 423) {
				// user blocked
				this.valid = false;
				this.blocked = true;
				this.initiated = true;
			} else if (response.status === 401) {
				// user not logged in
				this.valid = false;
				this.blocked = false;
				this.initiated = true;
			}
		},
		async logout() {
			let [request, abort] = this.makeRequest("GET", "/logout");
			let response = await request;
			if (response.ok) {
				return;
			} else {
				let body = await response.json();
				throw body;
			}
		},
	},
});
