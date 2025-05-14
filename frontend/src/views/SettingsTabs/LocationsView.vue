<script>
import { useServer } from '../../stores/server'
import { mapState, mapActions } from 'pinia'

export default {
    data() {
        return {
            locations: [],
            loading: false,
            headers: [
                { text: 'ID', value: 'id' },
                { text: 'Name', value: 'name' },
                { text: 'Actions', value: 'actions', sortable: false }
            ]
        }
    },
    computed: {
        //
    },
    methods: {
        ...mapActions(useServer, ['getLocations']),
        async fetchLocations() { 
            try {
                this.locations = await this.getLocations()
            } catch (error) {
                console.error('Locations fetch failed:', error)
            }
        }
    },
    mounted() {
        this.fetchLocations()
    }
}
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
</template>