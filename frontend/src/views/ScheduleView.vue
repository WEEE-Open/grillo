<script>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { useServer } from "../stores/server";
import { mapActions } from "pinia";


export default {
	components: {
		VCalendar,
	},
	data() {
		let now = new Date();
		let soon = new Date();
		soon.setHours(soon.getHours() + 2);
		/*
		return {
			events: [
				{
					title: "asd",
					start: now,
					end: soon,
					color: "green",
					allDay: false,
				}
			]
		}
			*/
		return {
			events: [],
			dialog: false,
			loading: false,
			locations: [],
			bookingForm: {
				startTime: "",
				endTime: "",
				location: "" 
			}
		}
	},
	mounted (){
		this.fetchBookings();
		this.fetchLocations(); 
	},
	computed: {
		bookingDateTimeRules() {
		
			if (!this.bookingForm.startTime) return ["Start time is required"];
			if (!this.bookingForm.endTime) return ["End time is required"];
			if (!this.bookingForm.location) return ["Location is required"]; 
			if (new Date(this.bookingForm.startTime) >= new Date(this.bookingForm.endTime)) {
				return ["End time must be after start time"];
			}
			return [];
		},
		
		isBookingFormValid() {
			return this.bookingDateTimeRules.length === 0;
		},

		currentUser() {
			const serverStore = useServer();
			return serverStore.session.user;
		},

		isUserLoggedIn() {
			return this.currentUser && this.currentUser.id;
		}
	},
	methods: {
		...mapActions(useServer, ["getBookings", "createBooking", "getLocations"]), 

	
		async fetchLocations() {
			try {
				this.locations = await this.getLocations();
				
				if (this.locations.length > 0) {
					this.bookingForm.location = this.locations[0].id;
				}
			} catch(error) {
				console.log("Locations fetch failed: ", error);
			}
		},

		async fetchBookings() {
			try {
				this.events = []; 
			    let now = Math.floor(Date.now() / 1000); // UNIX timestamp in seconds

				let dbBookings = await this.getBookings(now);
				
				for (const dbBooking of dbBookings) {
					const startDate = new Date(dbBooking.startTime * 1000);
					const endDate = dbBooking.endTime ? new Date(dbBooking.endTime * 1000) : null;
					
					
					const calendarEvent = {
						title: `User ${dbBooking.userId}`,
						start: startDate,
						end: endDate,
						color: "green",
						allDay: false,
					};
					console.log(calendarEvent)
					
					this.events.push(calendarEvent);
				}
			}
			catch(error){
				console.log("Booking fetch failed: ", error);
			}
		},

		async addBooking(){
			try {
				const serverStore = useServer();
				const userId = serverStore.session.user.id;
				
				if (!userId) {
					throw new Error("User not logged in - please login first");
				}

				const bData = {
					startTime: this.bookingForm.startTime,  
					endTime: this.bookingForm.endTime,
					location: this.bookingForm.location, 
					userId: userId                         
				};

				console.log("Sending booking data:", bData);
				console.log("User session:", serverStore.session);
				
				await this.createBooking(bData);
				this.dialog = false;
				this.resetForm();
				await this.fetchBookings(); 
			}
			catch(error){
				console.log("Booking add failed: ", error);
				alert(`Failed to create booking: ${error.message}`);
			}
		},

		openAddEventDialog() {
			this.resetForm();
			this.dialog = true;
		},

		resetForm() {
			this.bookingForm = {
				startTime: "",
				endTime: "",
				location: this.locations.length > 0 ? this.locations[0].id : "" 
			};
		}
	}
};
</script>
<template>
	<v-main class="position-relative">
		<v-sheet>
			<VCalendar :events="events" view-mode="week" :weekdays="[0, 1, 2, 3, 4, 5, 6]" :interval-duration="2*60"/>
		</v-sheet>

		<v-btn
			color="green"
			size="large"
			icon
			elevation="6"
			class="floating-add-btn"
			@click="openAddEventDialog"
		>
			<v-icon size="28">mdi-plus</v-icon>
		</v-btn>

		<!-- booking/event creation -->
		<v-dialog v-model="dialog" max-width="600" persistent>
			<v-card>
				<v-card-title class="text-h5">Create a Booking</v-card-title>
				<v-card-subtitle v-if="isUserLoggedIn">
					Creating booking for user: {{ currentUser.name }}
				</v-card-subtitle>
				<v-card-subtitle v-else>
					User not logged in - Debug: {{ currentUser.name }}
				</v-card-subtitle>

				<v-card-text>
					<v-container>
						<v-row>
							
							<v-col cols="12">
								<v-select
									label="Location"
									v-model="bookingForm.location"
									:items="locations"
									item-title="name"
									item-value="id"
									variant="outlined"
									:disabled="!isUserLoggedIn"
									required
							/>
							</v-col>
							<v-col cols="12" md="6">
								<v-text-field
									label="Start Date and Time"
									v-model="bookingForm.startTime"
									type="datetime-local"
									:rules="bookingDateTimeRules"
									variant="outlined"
									:disabled="!isUserLoggedIn"
									required
								/>
							</v-col>
							<v-col cols="12" md="6">
								<v-text-field
									label="End Date and Time"
									v-model="bookingForm.endTime"
									type="datetime-local"
									:rules="bookingDateTimeRules"
									variant="outlined"
									:disabled="!isUserLoggedIn"
									required
								/>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>

				<v-card-actions>
					<v-btn variant="text" @click="dialog = false">
						Cancel
					</v-btn>
					<v-spacer></v-spacer>
					<v-btn 
						color="green" 
						variant="elevated"
						@click="addBooking" 
						:disabled="!isBookingFormValid || !isUserLoggedIn"
						prepend-icon="mdi-check"
					>
						Save Booking
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-main>
</template>

<style scoped>
.floating-add-btn {
	position: fixed;
	bottom: 24px;
	right: 24px;
	z-index: 10;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
}

.floating-add-btn:hover {
	transform: scale(1.1);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
