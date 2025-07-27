<script>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { useServer } from "../stores/server";
import { mapActions } from "pinia";

export default {
	components: {
		VCalendar
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
			bookingForm: {
				startTime: "",
				endTime: ""
			}
		}
	},
	mounted (){
		this.fetchBookings();
	},
	computed: {
		bookingDateTimeRules() {
			if (!this.bookingForm.startTime) return ["Start time is required"];
			if (!this.bookingForm.endTime) return ["End time is required"];
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
			return serverStore.session;
		},

		isUserLoggedIn() {
			return this.currentUser && this.currentUser.id;
		}
	},
	methods: {
		...mapActions(useServer, ["getBookings", "createBooking"]),

		async fetchBookings() {
			try {
				this.events = []; // Reset events array
				let dbBookings = await this.getBookings();
				//adapt dbBooking into Event for calendar
				for (const dbBooking of dbBookings) {
					const calendarEvent = {
						title: dbBooking.userId,
						start: dbBooking.startTime,
						end: dbBooking.endTime,
						color: "green",
						allDay: false,
					};
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
				const userId = serverStore.session?.id;
				
				if (!userId) {
					throw new Error("User not logged in - please login first");
				}

				const bData = {
					startTime: this.bookingForm.startTime,  
					endTime: this.bookingForm.endTime,     
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
				endTime: ""
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






		<!-- Dialog per creare booking/event -->
		<v-dialog v-model="dialog" max-width="600" persistent>
			<v-card>
				<v-card-title class="text-h5">Create a Booking</v-card-title>
				<v-card-subtitle v-if="isUserLoggedIn">
					Creating booking for user: {{ currentUser.id }}
				</v-card-subtitle>

				<v-card-text>
					<v-container>
						<v-row>
							<v-col cols="12" md="6">
								<v-text-field
									label="Start Date and Time *"
									v-model="bookingForm.startTime"
									type="datetime-local"
									:rules="bookingDateTimeRules"
									variant="outlined"
									prepend-inner-icon="mdi-clock-start"
									:disabled="!isUserLoggedIn"
									required
								/>
							</v-col>
							<v-col cols="12" md="6">
								<v-text-field
									label="End Date and Time *"
									v-model="bookingForm.endTime"
									type="datetime-local"
									:rules="bookingDateTimeRules"
									variant="outlined"
									prepend-inner-icon="mdi-clock-end"
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
