<script>
import { useServer } from "../../stores/server";
import { mapState, mapActions } from "pinia";

export default {
	data() {
		return {
			locations: [],
			loading: false,
			headers: [
				{ text: "ID", value: "id" },
				{ text: "Name", value: "name" },
				{ text: "Actions", value: "actions", sortable: false },
			],
		};
	},
	computed: {
		//
	},
	methods: {
		...mapActions(useServer, ["getLocations"]),
		async fetchLocations() {
			try {
				this.locations = await this.getLocations();
			} catch (error) {
				console.error("Locations fetch failed:", error);
			}
		},
	},
	mounted() {
		this.fetchLocations();
	},
};
</script>

<template>
	<v-data-table
		:headers="headers"
		:items="locations"
		:loading="loading"
		loading-text="Loading locations..."
	>
		<template v-slot:top>
			<v-toolbar flat>
				<v-toolbar-title>Locations</v-toolbar-title>
				<v-divider class="mx-4" inset vertical></v-divider>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="fetchLocations">Refresh</v-btn>
			</v-toolbar>
		</template>
		<template v-slot:item.actions="{ item }">
			<v-btn icon @click="console.log('Edit', item)">
				<v-icon>mdi-pencil</v-icon>
			</v-btn>
			<v-btn icon @click="console.log('Delete', item)">
				<v-icon>mdi-delete</v-icon>
			</v-btn>
		</template>
	</v-data-table>

	<v-dialog v-model="dialog" max-width="600">
		<v-card>
			<v-card-title>{{ isEditing ? "Edit Location" : "Add Location" }}</v-card-title>
			<v-card-subtitle>
				{{ isEditing ? "Update token information" : "Create a new token" }}
			</v-card-subtitle>

			<v-card-text>
				<v-text-field label="Hash" v-model="record.hash"></v-text-field>
				<v-text-field label="Description" v-model="record.description"></v-text-field>
				<v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
				<v-checkbox label="Admin" v-model="record.admin"></v-checkbox>
			</v-card-text>

			<v-card-actions>
				<v-btn variant="text" @click="dialog = false">Cancel</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="save">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
