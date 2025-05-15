
<script>
import { useServer } from '../../stores/server'
import { mapActions } from 'pinia'

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
        { text: 'ID', value: 'id' },
        { text: 'Hash', value: 'hash' },
        { text: 'Read-only', value: 'readonly' },
        { text: 'Admin', value: 'admin' },
        { text: 'Description', value: 'description' },
        { text: 'Actions', value: 'actions', sortable: false }
      ]
    }
  },
  methods: {
    ...mapActions(useServer, ['getTokens', 'createToken', 'deleteToken']),

    async fetchTokens() {
      this.loading = true
      try {
        this.tokens = await this.getTokens()
      } catch (error) {
        console.error('Tokens fetch failed:', error)
      } finally {
        this.loading = false
      }
    },

    edit(item) {
      this.isEditing = true
      this.record = { ...item }
      this.dialog = true
    },

    add() {
      this.isEditing = false
      this.record = {
        readonly: false,
        admin: false,
        description: ''
      }
      this.dialog = true
    },

    async saveToken() {
        try{
            let result = await this.createToken(this.record);
        }
        catch(error){
            console.error('Token creation failed:', error);
        }
    },
    
    async cancelToken(item) {
        try{
            let result = await this.deleteToken(this.record);
        }
        catch(error){
            console.error('Token deletion failed:', error);
        }
    }
  },
  mounted() {
    this.fetchTokens()
  }
}
</script>

<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :items="tokens"
      :loading="loading"
      loading-text="Loading tokens..."
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
        <v-chip :color="item.readonly ? 'blue' : 'grey'" dark>{{ item.readonly ? 'Yes' : 'No' }}</v-chip>
      </template>

      <template v-slot:item.admin="{ item }">
        <v-chip :color="item.admin ? 'green' : 'red'" dark>{{ item.admin ? 'Admin' : 'User' }}</v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
    
        <v-btn icon @click="cancelToken(item)">
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

        <v-text-field label="Description" v-model="record.description"></v-text-field>
        <v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
        <v-checkbox label="Admin" v-model="record.admin"></v-checkbox>
        
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveToken">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

