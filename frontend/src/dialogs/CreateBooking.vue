<script>
import { useServer } from "../stores/server";
import { mapActions } from "pinia";

export default {
	props: {
		isOpen: Boolean,

		isAdmin: Boolean,
		locations: Array,
	},
	data() {
		let preselectedLocation = "";

		if (this.locations.length > 0) {
			preselectedLocation = this.locations.find(l => l.default) || this.locations[0] || "";
		}

		return {
			saving: false,

			type: "booking",
			location: preselectedLocation,
			title: "",
			description: "",
			startTime: "",
			endTime: "",
			endTimeTouched: false,
		};
	},
	computed: {
		locationRules() {
			if (!this.location) return ["Location is required"];
			return [];
		},

		dateStartRules() {
			if (!this.startTime) return ["Start time is required"];
			if (new Date(this.startTime) <= new Date()) {
				return ["Start time cannot be in the past!"];
			}

			return [];
		},

		dateEndRules() {
			if (!this.endTime) {
				if (this.type == "booking") return ["End time is required"];
			} else {
				if (new Date(this.startTime) >= new Date(this.endTime)) {
					return ["End time must be after start time"];
				}
			}
			return [];
		},

		isFormValid() {
			return (
				this.dateStartRules.length === 0 &&
				this.dateEndRules.length === 0 &&
				this.locationRules.length === 0
			);
		},
	},
	methods: {
		...mapActions(useServer, ["createBooking", "createEvent"]),

		onStartTimeUpdate(val) {
			if (!this.endTimeTouched) {
				this.endTime = val;
			}
		},

		onEndTimeUpdate() {
			this.endTimeTouched = true;
		},

		async save() {
			try {
				this.saving = true;

				if (this.type == "booking") {
					await this.createBooking({
						startTime: this.startTime,
						endTime: this.endTime,
						location: this.location.id,
					});
				} else if (this.type == "event") {
					await this.createEvent({
						startTime: this.startTime,
						endTime: this.endTime,
						title: this.title,
						description: this.description,
					});
				}

				this.$emit("close");
			} catch (error) {
				// TODO: show errors in UI
				console.log("Booking add failed: ", error);
				alert(`Failed to create booking: ${error.message}`);
			} finally {
				this.saving = false;
			}
		},
	},
};
</script>
<template>
	<v-dialog :model-value="isOpen" max-width="600" @after-leave="$emit('closed')">
		<v-card>
			<v-card-title class="text-h5">Create</v-card-title>

			<v-card-text>
				<v-container>
					<v-row>
						<v-col cols="12" v-if="isAdmin">
							<v-btn-toggle v-model="type" color="secondary" border mandatory class="w-100">
								<v-btn value="booking" class="w-50">Booking</v-btn>
								<v-btn value="event" class="w-50">Event</v-btn>
							</v-btn-toggle>
						</v-col>
						<v-col cols="12" v-if="type == 'booking'">
							<v-select
								label="Location"
								v-model="location"
								:items="locations"
								:rules="locationRules"
								item-title="name"
								item-value="id"
								variant="outlined"
								required
							/>
						</v-col>
						<v-col cols="12" v-if="type == 'event'">
							<v-text-field label="Title" v-model="title" variant="outlined" required />
						</v-col>
						<v-col cols="12" v-if="type == 'event'">
							<v-textarea label="Description" v-model="description" variant="outlined" />
						</v-col>
						<v-col cols="12" md="6">
							<v-text-field
								label="Start Date and Time"
								v-model="startTime"
								type="datetime-local"
								:rules="dateStartRules"
								variant="outlined"
								required
								@update:model-value="onStartTimeUpdate"
							/>
						</v-col>
						<v-col cols="12" md="6">
							<v-text-field
								label="End Date and Time"
								v-model="endTime"
								type="datetime-local"
								:rules="dateEndRules"
								variant="outlined"
								required
								@update:model-value="onEndTimeUpdate"
							/>
						</v-col>
					</v-row>
				</v-container>
			</v-card-text>

			<v-card-actions>
				<v-btn variant="text" @click="$emit('close', null)"> Cancel </v-btn>
				<v-spacer></v-spacer>
				<v-btn
					color="green"
					variant="elevated"
					@click="save"
					:disabled="!isFormValid"
					:loading="saving"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
