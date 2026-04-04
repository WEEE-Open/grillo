<script>
export default {
	props: {
		isOpen: Boolean,

		title: String,
		description: String,
		confirmButton: {
			type: String,
			default: "Yes",
		},
		rejectButton: {
			type: String,
			default: "No",
		},
		swapButtons: {
			type: Boolean,
			default: false,
		},
	},
};
</script>
<template>
	<v-dialog :model-value="isOpen" max-width="600" @after-leave="$emit('closed')">
		<v-card :title="title" :text="description">
			<v-card-actions>
				<v-btn @click="$emit('close', false)">No</v-btn>
				<v-spacer />
				<v-btn @click="$emit('close', true)">Yes</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
