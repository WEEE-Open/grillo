<script>
import { mapActions } from "pinia";
import ConfirmYN from "./ConfirmYN.vue";
import { useServer } from "@/stores/server";
import { formatDateTime } from "@/plugins/utils";

export default {
	inject: ["dialog"],
	props: {
		isOpen: Boolean,

		booking: Object,
	},
	data() {
		return {
			loading: false,
		};
	},
	methods: {
		...mapActions(useServer, ["deleteBooking"]),

		formatDateTime,

		async handleDelete() {
			let result = await this.dialog(ConfirmYN, {
				title: "Confirm deleting booking?",
				description: `From ${this.formatDateTime(this.booking.startTime * 1000)} to ${this.formatDateTime(this.booking.endTime * 1000)} for ${this.booking.user.printableName}`,
			});
			if (result) {
				this.deleteBooking(this.booking.id);
				this.$emit("close");
			}
		},
	},
};
</script>
<template>
	<v-dialog :model-value="isOpen" max-width="500" @after-leave="$emit('closed')">
		<v-card title="Booking details">
			<v-card-text>
				<v-card variant="outlined" class="pa-3">
					<div class="d-flex align-center mb-2">
						<strong>Start:</strong>
						<span class="ml-2">{{ formatDateTime(booking.startTime * 1000) }}</span>
					</div>
					<div class="d-flex align-center">
						<strong>End:</strong>
						<span class="ml-2">{{ formatDateTime(booking.endTime * 1000) }}</span>
					</div>
				</v-card>
				<div class="mt-3">
					<h4 class="mb-2">Booked by</h4>
					<p>{{ booking.user.printableName }}</p>
					<h4 class="mb-2">Location</h4>
					<p>
						{{ booking.location.name }} <v-icon icon="mdi-star" v-if="booking.location.default" />
					</p>
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
