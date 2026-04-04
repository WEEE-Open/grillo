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

			location: preselectedLocation,
			startTime: "",
			endTime: "",
			summary: "",
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
			if (new Date(this.startTime) >= new Date()) {
				return ["Start time cannot be in the future!"];
			}

			return [];
		},

		dateEndRules() {
			if (!this.endTime) {
				return ["End time is required"];
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
		...mapActions(useServer, ["createAudit"]),

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

				await this.createAudit({
					startTime: this.startTime,
					endTime: this.endTime,
					location: this.location.id,
					summary: this.summary,
				});

				this.$emit("close");
			} catch (error) {
				// TODO: show errors in UI
				console.log("Booking add audit: ", error);
				alert(`Failed to create audit: ${error.message}`);
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
			<v-card-title class="text-h5">Create log</v-card-title>

			<v-card-text>
				<v-container>
					<v-row>
						<v-alert
							icon="mdi-alert"
							color="warning"
							title="Warning:"
							text="manually adding audits is only meant to be used in rare cases, under normal circumstances you should login and logout using the kiosk in the lab"
						/>
					</v-row>
					<v-row>
						<v-col cols="12">
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
						<v-col cols="12">
							<v-textarea label="Summary" v-model="summary" variant="outlined" />
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
