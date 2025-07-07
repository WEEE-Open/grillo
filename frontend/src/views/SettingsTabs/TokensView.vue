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
			fullStringDialog: false,
			copied: false, // make sure is copied at least once
			itemToDelete: null, // for confirmation dialog
			record: {
				readOnly: false,
				admin: false,
				description: "",
			},
			headers: [
				{ title: "ID", key: "id", align: "start", width: "15%" },
				{ title: "Permission", key: "permission", align: "center", width: "15%" },
				{ title: "Description", key: "description", align: "start", width: "35%" },
				{ title: "Actions", key: "actions", align: "end", width: "20%", sortable: false },
			],
		};
	},
	computed: {
		computedTokens() {
			return this.tokens.map(t => {
				let permission = "default";
				if (t.readOnly) {
					permission = "readOnly";
				} else if (t.admin) {
					permission = "admin";
				}
				return {
					...t,
					permission,
				};
			});
		},
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
		fullStringRule() {
			if (!this.copied) {
				return ["You must copy the token at least once"];
			}
		},
	},
	methods: {
		...mapActions(useServer, ["getTokens", "createToken", "deleteToken", "showfullString"]),

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
				readOnly: false,
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
					this.showfullString(result.fullString);
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
				this.copied = true;
				console.log("Token copied to clipboard");
			} catch (err) {
				console.error("Failed to copy Token:", err);
			}
		},

		confirmDelete(item) {
			this.itemToDelete = item;
			this.confirmDialog = true;
		},
		showfullString(fullstring) {
			this.generatedFullString = fullstring;
			this.fullStringDialog = true;
			this.copied = false; // reset copied state for new token
		},

		//cannot be both readOnly and admin
		onAdminChange() {
			if (this.record.admin) {
				this.record.readOnly = false;
			}
		},

		onReadonlyChange() {
			if (this.record.readOnly) {
				this.record.admin = false;
			}
		},
	},

	mounted() {
		this.fetchTokens();
	},
};
</script>

<template>
	<v-sheet rounded>
		<v-data-table
			:headers="headers"
			:items="computedTokens"
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

			<template v-slot:item.permission="{ item }">
				<v-chip v-if="item.readOnly" color="yellow">Read-only</v-chip>
				<v-chip v-else-if="item.admin" color="blue">Admin</v-chip>
				<v-chip v-else color="grey">Default</v-chip>
			</template>

			<template v-slot:item.actions="{ item }">
				<div class="d-flex justify-end">
					<v-btn variant="text" icon="mdi-delete" @click="confirmDelete(item)" />
				</div>
			</template>
		</v-data-table>
	</v-sheet>

	<v-dialog v-model="dialog" max-width="600">
		<v-card>
			<v-card-title>Add Token</v-card-title>
			<v-card-subtitle> Create a new token </v-card-subtitle>

			<v-card-text>
				<v-sheet class="d-flex justify-space-evenly">
					<v-checkbox
						label="Read-only"
						v-model="record.readOnly"
						@update:modelValue="onReadonlyChange"
						:disabled="record.admin"
					/>
					<v-checkbox
						label="Admin"
						v-model="record.admin"
						@update:modelValue="onAdminChange"
						:disabled="record.readOnly"
					/>
				</v-sheet>
				<v-textarea label="Description" v-model="record.description" :rules="inputRules" />
			</v-card-text>

			<v-card-actions>
				<v-btn variant="text" @click="dialog = false">Cancel</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="saveToken" :disabled="inputRules.length > 0">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog v-model="confirmDialog" max-width="400">
		<v-card>
			<v-card-title class="text-h5">Confirm Deletion</v-card-title>
			<v-card-text>
				<p>Are you sure you want to delete this token "{{ itemToDelete.id }}"?</p>
				<span class="text-red">This action cannot be undone.</span>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
				<v-btn color="error" @click="removeToken(itemToDelete)">Delete</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- FullString dialog-->
	<v-dialog v-model="fullStringDialog" max-width="500">
		<v-card>
			<v-card-title class="text-h5">Token Generated Successfully</v-card-title>
			<v-card-text>
				<p>Your Token has been generated. Please copy and store it in a safe place.</p>
				<p><strong>This will NOT be shown again.</strong></p>
				<v-text-field
					:value="generatedFullString"
					label="Click to show token"
					readonly
					append-icon="mdi-content-copy"
					@click:append="() => copyText(generatedFullString)"
				></v-text-field>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-tooltip bottom :disabled="copied" text="Press copy at least once">
					<template v-slot:activator="{ props }">
						<div v-bind="props" class="d-inline-block">
							<v-btn
								color="primary"
								text
								@click="
									fullStringDialog = false;
									copied = false;
								"
								:disabled="!copied"
								>Close</v-btn
							>
						</div>
					</template>
				</v-tooltip>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
