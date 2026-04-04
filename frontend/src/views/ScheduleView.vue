<script>
import ViewBooking from "@/dialogs/ViewBooking.vue";
import { useServer } from "../stores/server";
import { mapActions, mapState } from "pinia";
import CreateBooking from "@/dialogs/CreateBooking.vue";
import ViewEvent from "@/dialogs/ViewEvent.vue";

export default {
	inject: ["dialog"],
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
		...mapState(useServer, ["session"]),

		displayingEvents() {
			return [...this.events, ...this.bookings];
		},
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
		...mapActions(useServer, ["getBookings", "getLocations", "getEvents"]),

		async fetchLocations() {
			try {
				this.locations = await this.getLocations();
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
				this.events = [];
				for (const dbEvent of dbEvents) {
					const startDate = new Date(dbEvent.startTime * 1000);
					const endDate = dbEvent.endTime ? new Date(dbEvent.endTime * 1000) : null;
					this.events.push({
						name: `${dbEvent.title}`,
						start: startDate,
						end: endDate,
						color: "red",
						timed: true,
						kind: "event", //needed for the detail dialog
						event: dbEvent,
					});
				}
			} catch (error) {
				console.log("Events fetch failed: ", error);
			}
		},

		async openAddEventDialog() {
			await this.dialog(CreateBooking, {
				isAdmin: this.session.isAdmin,
				locations: this.locations,
			});

			this.fetchBookings(this.focus);
			this.fetchEvents();
		},

		async openEventDialog(nativeEvent, eventData) {
			if (eventData.event.kind == "booking") {
				await this.dialog(ViewBooking, {
					booking: eventData.event.booking,
				});
			} else if (eventData.event.kind == "event") {
				await this.dialog(ViewEvent, {
					event: eventData.event.event,
				});
			}
			this.fetchBookings(this.focus);
			this.fetchEvents();
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
			this.$refs.calendar.prev();
		},

		next() {
			this.$refs.calendar.next();
		},
	},
};
</script>

<template>
	<v-main class="position-relative">
		<v-sheet height="64">
			<v-toolbar>
				<v-btn class="mx-4" variant="outlined" @click="setToday"> Today </v-btn>
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
				@click:event="openEventDialog"
			/>
		</v-sheet>

		<v-fab
			v-if="!loading"
			color="green"
			app
			location="bottom right"
			elevation="5"
			size="large"
			icon="mdi-plus"
			@click="openAddEventDialog"
		/>
	</v-main>
</template>
