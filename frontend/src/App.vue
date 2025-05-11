<script>
import { RouterView } from 'vue-router';
import { useServer } from './stores/server.js';
import { mapState, mapActions } from 'pinia';

export default {
	components: [
		RouterView
	],
	data() {
		return {
			ready: false,
		}
	},
	computed: {
		...mapState(useServer, ['valid', 'blocked']),
	},
	methods: {
		...mapActions(useServer, ['init']),
	},
	async mounted() {
		await this.init();
		if (this.valid) {
			this.ready = true;
		} else if (this.blocked) {
			// lmao rip
		} else {
			window.location.href = '/api/v1/login?return=%2F'; // this endpoint will take care of redirecting us
		}
	}

}
</script>

<template>
	<div v-if="blocked">You blocked foo</div>
	<RouterView v-if="ready" />
</template>