<script>
import { mapActions } from "pinia";
import ConfirmYN from "./ConfirmYN.vue";
import { useServer } from "@/stores/server";

export default {
	inject: ["dialog"],
	props: {
		isOpen: Boolean,

		event: Object,
	},
	data() {
		return {
			loading: false,
		};
	},
	methods: {
		...mapActions(useServer, ["deleteEvent"]),

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
		async handleDelete() {
			let result = await this.dialog(ConfirmYN, {
				title: "Confirm deleting event?",
				description: `${this.event.title}, from ${this.formatDateTime(this.event.startTime * 1000)} to ${this.formatDateTime(this.event.endTime * 1000)}`,
			});
			if (result) {
				await this.deleteEvent(this.event.id);
				this.$emit("close");
			}
		},
	},
};
</script>
<template>
	<v-dialog :model-value="isOpen" max-width="500" @after-leave="$emit('closed')">
		<v-card title="Event details">
			<v-card-text>
				<v-card variant="outlined" class="pa-3">
					<div class="d-flex align-center mb-2">
						<strong>Start:</strong>
						<span class="ml-2">{{ formatDateTime(event.startTime * 1000) }}</span>
					</div>
					<div class="d-flex align-center">
						<strong>End:</strong>
						<span class="ml-2">{{ formatDateTime(event.endTime * 1000) }}</span>
					</div>
				</v-card>
				<div class="mt-3">
					<h4 class="mb-2">Title</h4>
					<p>{{ event.title }}</p>
					<h4 class="mb-2">Description</h4>
					<p v-if="event.description">{{ event.description }}</p>
					<p v-else><i>No description</i></p>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-btn variant="text" color="danger" @click="handleDelete">Delete</v-btn>
				<v-spacer></v-spacer>
				<v-btn variant="text" @click="$emit('close')">Close</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
