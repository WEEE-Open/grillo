<script>
import { useServer } from "../stores/server";
import { mapActions } from "pinia";

export default {
	data() {
		//find current monday
		const today = new Date();
		const dayOfWeek = today.getDay();
		const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		const monday = new Date(today);
		monday.setDate(today.getDate() - daysToSubtract);

		return {
			events: [],
			bookings: [],
			dialog: false,
			bookDialog: false,
			loading: false,
			locations: [],
			focus: monday,
			bookingForm: {
				startTime: "",
				endTime: "",
				location: "",
			},
			endTimeTouched: false,
			// event details menu state
			selectedEvent: {},
			selectedElement: null,
			selectedOpen: false,
		};
	},
	mounted() {
		this.fetchLocations();
	},
	computed: {
		bookingDateStartRules() {
			if (!this.bookingForm.startTime) return ["Start time is required"];
			if (new Date(this.bookingForm.startTime) <= new Date()) {
				return ["Start time cannot be in the past!"];
			}

			return [];
		},

		bookingLocationRules() {
			if (!this.bookingForm.location) return ["Location is required"];
			return [];
		},

		bookingDateEndRules() {
			if (!this.bookingForm.endTime) return ["End time is required"];
			if (new Date(this.bookingForm.startTime) >= new Date(this.bookingForm.endTime)) {
				return ["End time must be after start time"];
			}
			return [];
		},

		isBookingFormValid() {
			return (
				this.bookingDateStartRules.length === 0 &&
				this.bookingDateEndRules.length === 0 &&
				this.bookingLocationRules.length === 0
			);
		},
		currentUser() {
			const serverStore = useServer();
			return serverStore.session.user;
		},
		isUserLoggedIn() {
			return this.currentUser && this.currentUser.id;
		},
		displayingEvents() {
			return [
				...this.events,
				...this.bookings,
			];
		}
	},
	watch: {
		focus: {
			async handler(newFocus, oldFocus) {
				if (newFocus !== oldFocus) {
					this.loading = true;
					await Promise.all([this.fetchBookings(newFocus), this.fetchEvents()]).finally(() => {
						this.loading = false;
					});
				}
			},
			immediate: true,
		},
	},
	methods: {
		...mapActions(useServer, ["getBookings", "createBooking", "getLocations", "getEvents"]),

=======
>>>>>>> c39da0d (Minor fix on event view + working on clickable events for calendar)
		async fetchLocations() {
			try {
				this.locations = await this.getLocations();
				if (this.locations.length > 0) {
					this.bookingForm.location = this.locations[0].id;
				}
			} catch (error) {
				console.log("Locations fetch failed: ", error);
			}
		},

		async fetchBookings(startOfWeek) {
			try {
				const unixStart = Math.floor(startOfWeek.getTime() / 1000);
				const dbBookings = await this.getBookings(unixStart);

				this.bookings = dbBookings.map(b => {
					const startDate = new Date(b.startTime * 1000);
					const endDate = b.endTime ? new Date(b.endTime * 1000) : null;
					return {
						name: `${b.user.name}`,
						start: startDate,
						end: endDate,
						color: "green",
						timed: true,
						kind: "booking", //needed for the detail
						booking: b,
					};
				});
			} catch (error) {
				console.log("Booking fetch failed: ", error);
			}
		},

		async fetchEvents() {
			try {
				const dbEvents = await this.getEvents();
				for (const dbEvent of dbEvents) {
					const startDate = new Date(dbEvent.startTime * 1000);
					const endDate = dbEvent.endTime ? new Date(dbEvent.endTime * 1000) : null;
					this.events.push({
						title: `${dbEvent.title}`,
						start: startDate,
						end: endDate,
						color: "red",
						allDay: false,
						kind: "event", //needed for the detail dialog
						event: dbEvent,
					});
				}
			} catch (error) {
				console.log("Events fetch failed: ", error);
			}
		},

		async addBooking() {
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
					userId: userId,
				};

				console.log("Sending booking data:", bData);
				console.log("User session:", serverStore.session);

				await this.createBooking(bData);
				this.dialog = false;
				this.resetForm();
				await this.fetchBookings(new Date());
			} catch (error) {
				console.log("Booking add failed: ", error);
				alert(`Failed to create booking: ${error.message}`);
			}
		},

		openAddEventDialog() {
			this.resetForm();
			this.dialog = true;
		},
		openBookDialog(nativeEvent, eventData) {
			console.log("Event clicked:", eventData);

			this.selectedEvent = eventData.event;
			this.bookDialog = true;
		},

		formatDateTime(date) {
			if (!date) return "";
			const d = date instanceof Date ? date : new Date(date);
			return d.toLocaleString("it-IT", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		},

		locationNameById(id) {
			const loc = this.locations.find(l => l.id === id);
			return loc ? loc.name : id;
		},

		//autofill
		onStartTimeUpdate(val) {
			if (!this.endTimeTouched) {
				this.bookingForm.endTime = val;
			}
		},
		onEndTimeUpdate() {
			this.endTimeTouched = true;
		},

		resetForm() {
			this.bookingForm = {
				startTime: "",
				endTime: "",
				location: this.locations.length > 0 ? this.locations[0].id : "",
			};
			this.endTimeTouched = false;
		},

		//C'è BISOGNO DI RAGIORARCI SU STA ROBA

		//Count how many people are booked for an event
		getBookingCountForEvent(evt) {
			if (!evt || !evt.start) return 0;
			const start = evt.start instanceof Date ? evt.start : new Date(evt.start);
			const end = evt.end ? (evt.end instanceof Date ? evt.end : new Date(evt.end)) : null;
			return this.events.filter(e => {
				if (e.kind !== "booking") return false;
				const bs = e.start instanceof Date ? e.start : new Date(e.start);
				const be = e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : null;
				// Overlap logic: booking intersects event window
				if (!end && !be) {
					return bs.getTime() === start.getTime();
				}
				const bookingStart = bs.getTime();
				const bookingEnd = be ? be.getTime() : Infinity;
				const eventStart = start.getTime();
				const eventEnd = end ? end.getTime() : Infinity;
				return bookingStart < eventEnd && bookingEnd > eventStart;
			}).length;
		},

		setToday() {
			this.focus = new Date();
		},

		prev() {
			this.$refs.calendar.prev()
		},

		next() {
			this.$refs.calendar.next()
		},
	},
};
</script>

<template>
	<v-main class="position-relative">
		<v-sheet height="64">
			<v-toolbar>
				<v-btn class="mx-4" variant="outlined" @click="setToday">
					Today
				</v-btn>
				<v-btn size="small" variant="text" icon @click="prev">
					<v-icon size="small"> mdi-chevron-left </v-icon>
				</v-btn>
				<v-btn size="small" variant="text" icon @click="next">
					<v-icon size="small"> mdi-chevron-right </v-icon>
				</v-btn>
				<v-toolbar-title v-if="$refs.calendar">
					{{ $refs.calendar.title }}
				</v-toolbar-title>
			</v-toolbar>
		</v-sheet>
		<v-sheet>
			<v-calendar
				class="h-100"
				ref="calendar"
				:events="displayingEvents"
				type="week"
				:weekdays="[1, 2, 3, 4, 5, 6]"
				:interval-duration="2 * 60"
				v-model="focus"
				@click:event="openBookDialog"
			/>
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
									:rules="bookingLocationRules"
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
									:rules="bookingDateStartRules"
									variant="outlined"
									:disabled="!isUserLoggedIn"
									required
									@update:model-value="onStartTimeUpdate"
								/>
							</v-col>
							<v-col cols="12" md="6">
								<v-text-field
									label="End Date and Time"
									v-model="bookingForm.endTime"
									type="datetime-local"
									:rules="bookingDateEndRules"
									variant="outlined"
									:disabled="!isUserLoggedIn"
									required
									@update:model-value="onEndTimeUpdate"
								/>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>

				<v-card-actions>
					<v-btn variant="text" @click="dialog = false"> Cancel </v-btn>
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

		<!-- booking dialog opened by clicking an event -->
		<v-dialog v-model="bookDialog" max-width="500">
			<v-card>
				<v-card-title class="text-h6">
					{{ selectedEvent?.kind === "booking" ? "Booking Details" : "Event Details" }}
				</v-card-title>
				<v-card-text>
					<div v-if="selectedEvent && selectedEvent.title">
						<h4 class="mb-2">{{ selectedEvent.title }}</h4>
						<v-card variant="outlined" class="pa-3">
							<div class="d-flex align-center mb-2">
								<strong>Start:</strong>
								<span class="ml-2">{{ formatDateTime(selectedEvent.start) }}</span>
							</div>
							<div class="d-flex align-center">
								<strong>End:</strong>
								<span class="ml-2">{{ formatDateTime(selectedEvent.end) }}</span>
							</div>
						</v-card>

						<!-- Conditional details -->
						<div class="mt-3" v-if="selectedEvent.kind === 'event' && selectedEvent.event">
							<h4 class="mb-2">Description</h4>
							<p>{{ selectedEvent.event.description || "No description available" }}</p>
							<h4 class="mb-2">Bookings overlapping this event</h4>
							<p>{{ getBookingCountForEvent(selectedEvent) }}</p>
						</div>
						<div class="mt-3" v-else-if="selectedEvent.kind === 'booking' && selectedEvent.booking">
							<h4 class="mb-2">Booked By</h4>
							<p>{{ selectedEvent.booking.user?.name || "Unknown user" }}</p>
							<h4 class="mb-2">Location</h4>
							<p>{{ locationNameById(selectedEvent.booking.location) }}</p>
						</div>
					</div>
					<div v-else>No event selected.</div>
				</v-card-text>
				<v-card-actions>
					<v-btn variant="text" @click="bookDialog = false">Close</v-btn>
					<v-spacer></v-spacer>
					<v-btn color="green" variant="elevated" @click="bookDialog = false"> OK </v-btn>
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
