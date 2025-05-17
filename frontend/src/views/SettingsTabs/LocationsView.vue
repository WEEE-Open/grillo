<script>
import { useServer } from "../../stores/server";
import { mapState, mapActions } from "pinia";

export default {
    data() {
        return {
            locations: [],
            loading: false,
            dialog: false, 
            isEditing: false, 
            record: { 
                id: '',
                name: ''
            },
            headers: [
               { title: 'ID', key: 'id', align: 'start', width: '30%' },
               { title: 'Name', key: 'name', align: 'start', width: '50%' },
               { title: 'Actions', key: 'actions', align: 'end', width: '20%', sortable: false }
            ]
        }
    },
    computed: {
        //
    },
    methods: {
        ...mapActions(useServer, ['getLocations', 'createLocation', 'updateLocation', 'deleteLocation']),
        async fetchLocations() { 
            try {
                this.locations = await this.getLocations();
            } catch (error) {
                console.error('Locations fetch failed:', error);
            }
        },
        async saveLocation() {
            try {
                let result;
                if (this.isEditing) {
                    result = await this.updateLocation(this.record);
                } else {
                    result = await this.createLocation(this.record);
                }
                
                if (result) {
                    this.dialog = false;
                    await this.fetchLocations();
                }
            } catch (error) {
                console.error(this.isEditing ? 'Location edit failed:' : 'Location creation failed:', error);
            }
        },

        
        async removeLocation(item){
            try{
                let result = await this.deleteLocation(item);
                if(result){
                    this.fetchLocations(); //check if there is a better method lolz
                }
            
            }
                catch(error){
                    console.error('Location deletion failed:', error);
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
        id: '',
        name: '',
      }
      this.dialog = true
    },

    },
    mounted() {
        this.fetchLocations();
    }
}
</script>

<template>
    
    <v-sheet border rounded>
        <v-data-table
            :headers="headers"
            :items="locations"
            :loading="loading"
            loading-text="Loading locations..."
            fixed-header
            height="400px"
        >
            <template v-slot:top>
                <v-toolbar flat>
                    <v-toolbar-title>Locations</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" prepend-icon="mdi-plus" @click="add">Add Location</v-btn>
                    <v-btn class="ml-2" @click="fetchLocations">Refresh</v-btn>
                </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end">
                    <v-btn icon class="mr-2" @click="edit(item)">  
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon @click="removeLocation(item)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </div>
            </template>
        </v-data-table>
    </v-sheet>




<v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit Location' : 'Add Location' }}</v-card-title>
      <v-card-subtitle>
        {{ isEditing ? 'Update location information' : 'Create a new location' }}
      </v-card-subtitle>

			<v-card-text>
				<v-text-field label="Hash" v-model="record.hash"></v-text-field>
				<v-text-field label="Description" v-model="record.description"></v-text-field>
				<v-checkbox label="Read-only" v-model="record.readonly"></v-checkbox>
				<v-checkbox label="Admin" v-model="record.admin"></v-checkbox>
			</v-card-text>
      <v-card-text>
         <v-text-field label="ID" v-model="record.id"></v-text-field>
        <v-text-field label="Name" v-model="record.name"></v-text-field>
      </v-card-text>

			<v-card-actions>
				<v-btn variant="text" @click="dialog = false">Cancel</v-btn>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="save">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
      <v-card-actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveLocation">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>




</template>
