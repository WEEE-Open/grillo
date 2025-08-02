import { ref, computed, isReadonly } from "vue";
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
			let [request, abort] = this.makeRequest("DELETE", "/user/session");
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
				this.defaultLocation = body.defaultLocation;
			} else {
				// TODO: display some kind of error
			}
		},
		async setConfig(key, value) {
			let [request, abort] = this.makeRequest("PATCH", "/config", { [key]: value });
			let response = await request;
			console.log(response);
			if (response.ok) {
				let body = await response.json();
				this.servicesLinks = body.servicesLinks;
				this.defaultLocation = body.defaultLocation;
				return true;
			} else {
				// TODO: display some kind of error
			}
		},
		async ring() {
			let [request, abort] = this.makeRequest("POST", "/locations/default/ring");
			let response = await request;
			if (response.ok) {
				return true;
			} else {
				// TODO: display some kind of error
			}
		},
		async getTokens() {
			let [request, abort] = this.makeRequest("GET", "/tokens");
			let response = await request;
			if (response.ok) {
				return await response.json();
			} else {
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
		async getLocations() {
			let [request, abort] = this.makeRequest("GET", "/locations");
			let response = await request;
			if (response.ok) {
				return await response.json();
			} else {
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occurred during locations load");
				}
			} //Da controllare tutti gli errori
		},
		async deleteToken(token) {
			let [request, abort] = this.makeRequest("DELETE", `/tokens/${token.id}`);

			let response = await request;
			if (response.ok) {
				return true;
			} else {
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occurred during token deletion");
				}
			} //Da controllare tutti gli errori
		},

		async createToken(token) {
			let [request, abort] = this.makeRequest("POST", "/tokens", {
				description: token.description,
				readOnly: token.readOnly,
				admin: token.admin,
			});

			try {
				let response = await request;
				if (response.ok) {
					const data = await response.json();
					return data;
				} else {
					if (response.status === 401) {
						throw new Error("Not authenticated");
					} else if (response.status === 403) {
						throw new Error("No permission");
					} else {
						throw new Error("Error occurred during token creation");
					}
				}
			} catch (error) {
				console.error("Token creation failed:", error);
				throw error;
			}
		},
		async createLocation(location) {
			let [request, abort] = this.makeRequest("POST", "/locations", {
				id: location.id,
				name: location.name,
			});

			let response = await request;
			if (response.ok) {
				return true;
			} else {
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else if (response.status === 400) {
					throw new Error("Already exist");
				} else {
					throw new Error("Error occurred during location creation");
				}
				//Da controllare tutti gli errori
			}
		},
		async updateLocation(location) {
			let [request, abort] = this.makeRequest("PATCH", `/locations/${location.id}`, {
				name: location.name,
			});

			let response = await request;
			if (response.ok) {
				return true;
			} else {
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} else if (response.status === 403) {
					throw new Error("No permission");
				} else {
					throw new Error("Error occurred during location update");
				}
			} //Da controllare tutti gli errori
		},
		async deleteLocation(location) {
			let [request, abort] = this.makeRequest("DELETE", `/locations/${location.id}`);

			let response = await request;
			if (response.ok) {
				return true;
			} else {
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} 
				else if (response.status === 403) {
					throw new Error("No permission");
				} 
				else {
					throw new Error("Error occurred during location deletion");
				}
			} //Da controllare tutti gli errori
		},

		/* BOOKINGS */
		async getBookings(date){

			let [request, abort] = this.makeRequest("GET", `/bookings/${date}`);

			let response = await request;
			if(response.ok){
				return response.json();
			}
			else{
				throw new Error("Some error occured");
			}
		},

		async createBooking(data){
			console.log('Sending booking data:', data);
			
			const payload = {
				startTime: new Date(data.startTime).getTime(), // milliseconds
				endTime: new Date(data.endTime).getTime(),
				location: data.location 
			};
			
			let [request, abort] = this.makeRequest("POST", "/bookings", payload);
			
			let response = await request;
			
			console.log('Response status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.log('Error response:', errorText);
			}
			
			return response;
		},


		/* EVENTS */

		async getEvents(){
			let [request, abort] = this.makeRequest("GET", `/events`);

			let response = await request;
			if(response.ok){
				return response.json();
			}
			else{
				throw new Error("Some error occured");
			}
		},

		async createEvent(event){
			let [request, abort] = this.makeRequest("POST", "/events", {
				startTime: new Date(event.startTime).getTime(),
       			endTime: new Date(event.endTime).getTime(),     
				title: event.title,
				description: event.description,
			})
			
			let response = await request;

			if(response.ok){
				return true;
			}
			else{
				if (response.status === 401) {
					throw new Error("Not authenticated");
				} 
				else if (response.status === 403) {
					throw new Error("No permission");
				}
				else if (response.status === 400) {
					throw new Error("Already exist");
				} 
				else {
					throw new Error("Error occurred during event creation");
				}
			}
		}
	},
});
