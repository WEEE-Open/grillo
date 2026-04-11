<script>
import { useServer } from "../stores/server";
import { mapActions, mapState } from "pinia";

export default {
	props: {
		isOpen: Boolean,

		oldAudit: {
			type: Object,
			required: false,
		},
	},
	data() {
		if (this.oldAudit) {
			return {
				saving: false,
				users: [],

				location: this.oldAudit.location,
				user: this.oldAudit.user.id,
				startTime: (new Date(this.oldAudit.startTime * 1000)).toLocaleString("sv-SE", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit"
				}).replace(" ", "T"),
				endTime: (new Date(this.oldAudit.endTime * 1000)).toLocaleString("sv-SE", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit"
				}).replace(" ", "T"),
				summary: this.oldAudit.summary,
				approved: this.oldAudit.approved,
				endTimeTouched: true,
			}
		}

		return {
			saving: false,
			users: [],

			location: "",
			user: "",
			startTime: "",
			endTime: "",
			summary: "",
			approved: false,
			endTimeTouched: false,
		};
	},
	computed: {
		...mapState(useServer, ["session", "locations"]),

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

		summaryRules() {
			if (!this.summary) {
				return ["A summary is required"];
			}
			return [];
		},

		isFormValid() {
			return (
				this.dateStartRules.length === 0 &&
				this.dateEndRules.length === 0 &&
				this.locationRules.length === 0 &&
				this.summaryRules.length === 0
			);
		},
	},
	watch: {
		'session.isAdmin': {
			handler(value) {
				if (value) {
					if (!this.oldAudit) {
						this.approved = true;
					}
				} else {
					if (this.oldAudit) {
						this.approved = false;
					}
				}
			},
			immediate: true,
		},
		locations: {
			handler() {
				if (this.locations.length > 0 && this.location == "") {
					this.location = this.locations.find(l => l.default) || this.locations[0] || "";
				}
			},
			immediate: true,
		}
	},
	methods: {
		...mapActions(useServer, ["createAudit", "editAudit"]),

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

				if (this.oldAudit) {
					await this.editAudit(this.oldAudit.id, {
						startTime: this.startTime,
						endTime: this.endTime,
						location: this.location.id,
						summary: this.summary,
						approved: this.approved,
					});
				} else {
					await this.createAudit({
						startTime: this.startTime,
						endTime: this.endTime,
						location: this.location.id,
						summary: this.summary,
						approved: this.approved,
					});
				}

				this.$emit("close");
			} catch (error) {
				// TODO: show errors in UI
				console.log("Create/edit audit: ", error);
				alert(`Failed to create/edit audit: ${error.message}`);
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
							<v-textarea label="Summary" v-model="summary" variant="outlined" :rules="summaryRules" required />
						</v-col>
						<v-col cols="12" v-if="session?.isAdmin">
							<v-checkbox
								label="Approved"
								v-model="approved"
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
