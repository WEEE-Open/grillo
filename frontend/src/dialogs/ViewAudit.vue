<script>
import { mapActions, mapState } from "pinia";
import { useServer } from "@/stores/server";
import { formatDateTime } from "@/plugins/utils";
import CreateEditAudit from "./CreateEditAudit.vue";

export default {
	inject: ["dialog"],
	props: {
		isOpen: Boolean,

		audit: Object,
	},
	data() {
		return {
			loading: false,
		};
	},
	computed: {
		...mapState(useServer, ["session"]),
	},
	methods: {
		...mapActions(useServer, []),

		formatDateTime,

		handleEdit() {
			this.$emit("replace", CreateEditAudit, { oldAudit: this.audit });
		}
	},
};
</script>
<template>
	<v-dialog :model-value="isOpen" max-width="500" @after-leave="$emit('closed')">
		<v-card title="Audit details">
			<v-card-text>
				<v-card variant="outlined" class="pa-3">
					<div class="d-flex align-center mb-2">
						<strong>Start:</strong>
						<span class="ml-2">{{ formatDateTime(audit.startTime * 1000) }}</span>
					</div>
					<div class="d-flex align-center">
						<strong>End:</strong>
						<span class="ml-2">{{ formatDateTime(audit.endTime * 1000) }}</span>
					</div>
				</v-card>
				<div class="mt-3">
					<h4 class="mb-2">User</h4>
					<p>{{ audit.user.printableName }}</p>
					<h4 class="mb-2">Location</h4>
					<p>
						{{ audit.location.name }} <v-icon icon="mdi-star" v-if="audit.location.default" />
					</p>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-btn variant="text" @click="handleEdit" v-if="session.user.id == audit.user.id || session?.isAdmin">Edit</v-btn>
				<v-spacer></v-spacer>
				<v-btn variant="text" @click="$emit('close')">Close</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
