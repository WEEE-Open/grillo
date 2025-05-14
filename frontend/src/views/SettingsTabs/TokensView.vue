<script>
import { useServer } from "../../stores/server";
import { mapState, mapActions } from "pinia";

export default {
	data() {
		return {
			tokens: [],
			loading: false,
			headers: [
				{ text: "ID", value: "id" },
				{ text: "Token", value: "token" },
				{ text: "Actions", value: "actions", sortable: false },
			],
		};
	},
	computed: {
		//
	},
	methods: {
		...mapActions(useServer, ["getTokens"]),
		async fetchTokens() {
			try {
				this.tokens = await this.getTokens();
			} catch (error) {
				console.error("Tokens fetch failed:", error);
			}
		},
	},
	mounted() {
		this.fetchTokens();
	},
};
</script>

<template>
	<v-data-table
		:headers="headers"
		:items="tokens"
		:loading="loading"
		loading-text="Loading tokens..."
	>
		<template v-slot:top>
			<v-toolbar flat>
				<v-toolbar-title>API Tokens</v-toolbar-title>
				<v-divider class="mx-4" inset vertical></v-divider>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="fetchTokens"> Refresh </v-btn>
			</v-toolbar>
		</template>
		<template v-slot:item.actions="{ item }">
			<v-btn icon @click="console.log('Delete', item)">
				<v-icon>mdi-delete</v-icon>
			</v-btn>
		</template>
	</v-data-table>
</template>
