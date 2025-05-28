<script>
import { useServer } from "../../stores/server";
import { mapActions } from "pinia";

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 255;

export default {
	data() {
		return {
			tokens: [],
			loading: false,
			dialog: false,
			confirmDialog: false,
			passwordDialog: false,
			itemToDelete: null, // for confirmation dialog
			record: {
				readonly: false,
				admin: false,
				description: "",
			},
			headers: [
				{ title: "ID", value: "id", align: "start", width: "15%" },
				{ title: "Read-only", value: "readonly", align: "center", width: "15%" },
				{ title: "Admin", value: "admin", align: "center", width: "15%" },
				{ title: "Description", value: "description", align: "start", width: "35%" },
				{ title: "Actions", value: "actions", align: "end", width: "20%", sortable: false },
			],
		};
	},
	computed: {
		maxLength() {
			return NAME_MAX_LENGTH; //return the const usable in the template
		},
		inputRules() {
			if (!this.record.description) return ["Description is required"];
			if (this.record.description.length > NAME_MAX_LENGTH)
				return [`Description must be less than ${NAME_MAX_LENGTH} characters`];
			if (this.record.description.length < NAME_MIN_LENGTH)
				return [`Description must be at least ${NAME_MIN_LENGTH} characters`];
			return [];
		},
	},
	methods: {
		...mapActions(useServer, ["getTokens", "createToken", "deleteToken", "showPassword"]),

		async fetchTokens() {
			this.loading = true;
			try {
				this.tokens = await this.getTokens();
			} catch (error) {
				console.error("Tokens fetch failed:", error);
			} finally {
				this.loading = false;
			}
		},

		edit(item) {
			this.isEditing = true;
			this.record = { ...item };
			this.dialog = true;
		},

		add() {
			this.isEditing = false;
			this.record = {
				readonly: false,
				admin: false,
				description: "",
			};
			this.dialog = true;
		},

		async saveToken() {
			try {
				let result = await this.createToken(this.record);
				if (result) {
					this.dialog = false; //close dialog
					this.showPassword(result.password);
					this.fetchTokens(); //check if there is a better method lolz
				}
			} catch (error) {
				console.error("Token creation failed:", error);
			}
		},

		async removeToken(item) {
			try {
				let result = await this.deleteToken(item);
				if (result) {
					this.fetchTokens(); //check if there is a better method lolz
					this.confirmDialog = false;
				}
			} catch (error) {
				console.error("Token deletion failed:", error);
			}
		},
		async copyText(text) {
			try {
				await navigator.clipboard.writeText(text);
				console.log("Password copied to clipboard");
			} catch (err) {
				console.error("Failed to copy password:", err);
			}
		},

		confirmDelete(item) {
			this.itemToDelete = item;
			this.confirmDialog = true;
		},
		showPassword(password) {
			this.generatedPassword = password;
			this.passwordDialog = true;
		},
	},

	mounted() {
		this.fetchTokens();
	},
};
</script>

<template>
	<v-sheet border rounded>
		<v-data-table
			:headers="headers"
			:items="tokens"
			:loading="loading"
			loading-text="Loading tokens..."
			fixed-header
			height="400px"
		>
			<template v-slot:top>
				<v-toolbar flat>
					<v-toolbar-title>API Tokens</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn color="primary" prepend-icon="mdi-plus" @click="add">Add Token</v-btn>
					<v-btn class="ml-2" @click="fetchTokens">Refresh</v-btn>
				</v-toolbar>
			</template>

			<template v-slot:item.readonly="{ item }">
				<v-chip :color="item.readonly ? 'green' : 'blue'" dark>{{
					item.readonly ? "Yes" : "No"
				}}</v-chip>
			</template>

			<template v-slot:item.admin="{ item }">
				<v-chip :color="item.admin ? 'green' : 'red'" dark>{{ item.admin ? "Yes" : "No" }}</v-chip>
			</template>

			<template v-slot:item.actions="{ item }">
				<div class="d-flex justify-end">
					<v-btn icon @click="confirmDelete(item)">
						<v-icon>mdi-delete</v-icon>
					</v-btn>
				</div>
			</template>
		</v-data-table>
	</v-sheet>

	<v-dialog v-model="dialog" max-width="600">
		<v-card>
			<v-card-title>Add Token</v-card-title>
			<v-card-subtitle> Create a new token </v-card-subtitle>

			<v-card-text>
				<v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
				<v-checkbox label="Admin" v-model="record.admin"></v-checkbox>

				<v-textarea
					label="Description"
					v-model="record.description"
					:rules="inputRules"
				></v-textarea>
			</v-card-text>

			<v-card-actions>
				<v-btn variant="text" @click="dialog = false">Cancel</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="saveToken" :disabled="inputRules.length > 0">Save</v-btn>
				<!-- input valid return [] -->
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Confimation dialog-->
	<v-dialog v-model="confirmDialog" max-width="400">
		<v-card>
			<v-card-title class="text-h5">Confirm Deletion</v-card-title>
			<v-card-text>
				Are you sure you want to delete this token "{{ itemToDelete.id }}"?
				<br />
				<span class="text-red">This action cannot be undone.</span>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
				<v-btn color="error" @click="removeToken(itemToDelete)">Delete</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Password dialog-->
	<v-dialog v-model="passwordDialog" max-width="500">
		<v-card>
			<v-card-title class="text-h5">Token Generated Successfully</v-card-title>
			<v-card-text>
				<p>Your password has been generated. Please copy and store it in a safe place.</p>
				<p><strong>This will NOT be shown again.</strong></p>
				<v-text-field
					:value="generatedPassword"
					label="Click for showing password"
					readonly
					append-icon="mdi-content-copy"
					@click:append="() => copyText(generatedPassword)"
				></v-text-field>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary" text @click="passwordDialog = false">Close</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
