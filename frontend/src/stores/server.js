import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useServer = defineStore("server", {
	state: () => ({
		initiated: false,
		valid: false,
		blocked: false,
		session: null,
		servicesLinks: [],
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
			await this.loadConfig();
			this.initiated = true;
		},
		async verifySession() {
			let [request, abort] = this.makeRequest("GET", "/user");
			let response = await request;
			let body = await response.json();
			if (response.ok) {
				// user logged in
				this.session = body;
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
		async loadConfig() {
			let [request, abort] = this.makeRequest("GET", "/config");
			let response = await request;
			if (response.ok) {
				let body = await response.json();
				this.servicesLinks = body.servicesLinks;
			} else {
				// TODO: display some kind of error
			}
		},
		async ring() {
			let [request, abort] = this.makeRequest("POST", "/lab/ring");
			let response = await request;
			if (response.ok) {
				return true;
				
			} else {
				// TODO: display some kind of error
			}
		},
		async getTokens(){
			let [request, abort] = this.makeRequest("GET", "/tokens");
			let response = await request;
			if(response.ok){
				return await response.json(); 
			}
			else{
				if (response.status === 401) {
					throw new Error("Not autheticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occured during tokens load");
				}
			}
			//da finire
		},
		async getLocations(){
			let [request, abort] = this.makeRequest("GET", "/locations");
			let response = await request;
			if(response.ok){
				return await response.json(); 
			}
			else{
				if (response.status === 401) {
					throw new Error("Not autheticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occured during locations load");
				}
				//da finire
			}
		},
		async deleteToken(token){
			let [request, abort] = this.makeRequest("DELETE", `/tokens/${token.id}`);
			
			let response = await request;
			if(response.ok){
				return true; 
			}
			else{
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occurred during token deletion");
				}
			}
		},
		
		async createToken(token){
			
			let [request, abort] = this.makeRequest("POST", "/tokens/new", {
				description: token.description,
				isReadOnly: token.readonly,
				isAdmin: token.admin
			});
			
			let response = await request;
			if(response.ok){
				return true; 
			}
			else{
				if (response.status === 401) {
					throw new Error("Not autheticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occured during token creation");
				}
			}
},
	},
});
