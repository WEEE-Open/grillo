<script>
import { useServer } from '../../stores/server'
import { mapActions } from 'pinia'

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 50
import { useServer } from "../../stores/server";
import { mapActions } from "pinia";

export default {
  data() {
    return {
      tokens: [],
      loading: false,
      dialog: false,
      record: {
        readonly: false,
        admin: false,
        description: ''
      },
      headers: [
        { text: 'ID', value: 'id', width: '15%' },
        { text: 'Hash', value: 'hash', width: '20%' },
        { text: 'Read-only', value: 'readonly', width: '10%' },
        { text: 'Admin', value: 'admin', width: '10%' },
        { text: 'Description', value: 'description', width: '35%' },
        { text: 'Actions', value: 'actions', sortable: false, width: '10%' }
      ],
      
    }
  },
  computed: {
        maxLength() {
            return NAME_MAX_LENGTH //return the const usable in the template
        },   
        inputRules() {
            if (!this.record.description) return ['Description is required']
            if (this.record.description.length > NAME_MAX_LENGTH) return [`Description must be less than ${NAME_MAX_LENGTH} characters`]
            if (this.record.description.length < NAME_MIN_LENGTH) return [`Description must be at least ${NAME_MIN_LENGTH} characters`]
            return []
        },
        
    },
  methods: {
    ...mapActions(useServer, ['getTokens', 'createToken', 'deleteToken']),
	data() {
		return {
			tokens: [],
			loading: false,
			dialog: false,
			record: {
				readonly: false,
				admin: false,
				description: "",
			},
			headers: [
				{ text: "ID", value: "id", width: "15%" },
				{ text: "Hash", value: "hash", width: "20%" },
				{ text: "Read-only", value: "readonly", width: "10%" },
				{ text: "Admin", value: "admin", width: "10%" },
				{ text: "Description", value: "description", width: "35%" },
				{ text: "Actions", value: "actions", sortable: false, width: "10%" },
			],
		};
	},
	methods: {
		...mapActions(useServer, ["getTokens", "createToken", "deleteToken"]),

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
        try{
            let result = await this.createToken(this.record);
            if(result){
              this.dialog = false; //close dialog 
              this.fetchTokens(); //check if there is a better method lolz
            }
        }
        catch(error){
            console.error('Token creation failed:', error);
        }
    },
    
    async removeToken(item) {
        try{
            let result = await this.deleteToken(item);
            if(result){
              this.fetchTokens(); //check if there is a better method lolz
            }
            
        }
        catch(error){
            console.error('Token deletion failed:', error);
        }
    }
  },

  
  mounted() {
    this.fetchTokens();
  }
}
		async saveToken() {
			try {
				let result = await this.createToken(this.record);
				if (result) {
					this.dialog = false; //close dialog
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
				}
			} catch (error) {
				console.error("Token deletion failed:", error);
			}
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
				<v-chip :color="item.readonly ? 'blue' : 'grey'" dark>{{
					item.readonly ? "Yes" : "No"
				}}</v-chip>
			</template>

			<template v-slot:item.admin="{ item }">
				<v-chip :color="item.admin ? 'green' : 'red'" dark>{{
					item.admin ? "Admin" : "User"
				}}</v-chip>
			</template>

			<template v-slot:item.actions="{ item }">
				<v-btn icon @click="removeToken(item)">
					<v-icon>mdi-delete</v-icon>
				</v-btn>
			</template>

			<template v-slot:no-data>
				<v-btn prepend-icon="mdi-backup-restore" @click="fetchTokens">Reload</v-btn>
			</template>
		</v-data-table>
	</v-sheet>

	<v-dialog v-model="dialog" max-width="600">
		<v-card>
			<v-card-title>Add Token</v-card-title>
			<v-card-subtitle> Create a new token </v-card-subtitle>

      <v-card-text>

        <v-text-field label="Description"
                      v-model="record.description"
                      :counter="maxLength"
                      :rules="inputRules"
                      ></v-text-field>
        <v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
        <v-checkbox label="Admin" v-model="record.admin"></v-checkbox>
        
      </v-card-text>
			<v-card-text>
				<v-text-field label="Description" v-model="record.description"></v-text-field>
				<v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
				<v-checkbox label="Admin" v-model="record.admin"></v-checkbox>
			</v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveToken" :disabled="inputRules.length > 0">Save</v-btn> <!-- input valid return [] -->
      </v-card-actions>
    </v-card>
  </v-dialog>

			<v-card-actions>
				<v-btn variant="text" @click="dialog = false">Cancel</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="saveToken">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
