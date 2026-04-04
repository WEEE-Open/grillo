<script>
import { markRaw } from "vue";

export default {
	data() {
		return {
			dialogs: [],
		};
	},
	methods: {
		openDialog(component, props = {}) {
			return new Promise((resolve, reject) => {
				const id = Symbol();
				this.dialogs.push({
					id,
					component: markRaw(component),
					props: { ...props, isOpen: true },
					resolve,
					reject,
				});
			});
		},
		closeDialog(id, result) {
			const index = this.dialogs.findIndex(d => d.id === id);
			if (index !== -1) {
				this.dialogs[index].resolve(result);
				this.dialogs[index].props.isOpen = false;
			}
		},
		removeFromStack(id) {
			const index = this.dialogs.findIndex(d => d.id === id);
			if (index !== -1) {
				this.dialogs.splice(index, 1);
			}
		},
	},
	provide() {
		return {
			dialog: this.openDialog,
		};
	},
};
</script>
<template>
	<slot />

	<component
		v-for="d in dialogs"
		:key="d.id"
		:is="d.component"
		v-bind="d.props"
		@close="closeDialog(d.id, $event)"
		@closed="removeFromStack(d.id)"
	/>
</template>
