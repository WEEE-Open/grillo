<script>
import { mapActions } from "pinia";
import { useServer } from "../stores/server";

export default {
    data() {
        return {
            events: [],
            dialog: false,
            detailDialog: false,
            confirmDialog: false,
            selectedEvent: null,
            isEditing: false,
            itemToDelete: null,
            record: {
                title: '',
                description: '',
                startTime: '',
                endTime: ''
            }
        }
    },
    mounted(){
        this.fetchEvents();
    },
    computed: {
        inputRules() {
            if (!this.record.title) return ["Title is required"];
            if (!this.record.startTime) return ["Start time is required"];
            if (!this.record.endTime) return ["End time is required"];
            if (new Date(this.record.startTime) >= new Date(this.record.endTime)) {
                return ["End time must be after start time"];
            }
            return [];
        },
        
        isEventFormValid() {
            return this.inputRules.length === 0;
        }
    },
    methods: {
        ...mapActions(useServer, ["getEvents", "createEvent", "editEvent", "deleteEvent"]),

        async fetchEvents(){
            try {
                this.events = await this.getEvents();
            } 
            catch(error){
                console.log("Events fetch failed: ", error);
            }
        },

        async saveEvent() {
            try {
                const eventData = {
                    title: this.record.title,
                    description: this.record.description,
                    startTime: this.record.startTime, 
                    endTime: this.record.endTime     
                };

                console.log("Sending event data:", eventData);
                
                if (this.isEditing) {
                    await this.editEvent(this.selectedEvent.id, eventData);
                } else {
                    await this.createEvent(eventData);
                }
                
                this.dialog = false;
                await this.fetchEvents();
            } catch (error) {
                console.log("Event operation failed: ", error);
            }
        },

        add() {
            this.isEditing = false;
            this.record = {
                title: '',
                description: '',
                startTime: '',
                endTime: ''
            };
            this.dialog = true;
        },

        edit(event) {
            this.isEditing = true;
            this.selectedEvent = event;
            
            
            const startDate = new Date(event.startTime * 1000);
            const endDate = new Date(event.endTime * 1000);
            
            this.record = {
                title: event.title,
                description: event.description || '',
                startTime: this.formatDateTimeForInput(startDate),
                endTime: this.formatDateTimeForInput(endDate)
            };
            
            this.detailDialog = false;
            this.dialog = true;
        },

        async removeEvent(item) {
            try {
                let result = await this.deleteEvent(item.id);
                if (result) {
                    this.fetchEvents();
                    this.confirmDialog = false;
                }
            } catch (error) {
                console.error("Event deletion failed:", error);
            }
        },

        confirmDelete(item) {
            this.itemToDelete = item;
            this.confirmDialog = true;
        },

        formatDateTimeForInput(date) {
            // Format YYYY-MM-DDTHH:MM datetime-local input
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        },

        showEventDetails(event) {
            this.selectedEvent = event;
            this.detailDialog = true;
        },

        closeEventDetails() {
            this.detailDialog = false;
            this.selectedEvent = null;
        },

        formatDateTime(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString('it-IT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
    }
};
</script>

<template>
    <v-main class="position-relative">
        <v-container>
            <h2>Events</h2>

            <v-list v-if="events && events.length > 0">
                <v-list-item
                    v-for="event in events"
                    :key="event.id"
                    @click="showEventDetails(event)"
                    class="cursor-pointer"
                >
                    <v-list-item-title>{{ event.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                        {{ event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 'No description' }}
                        <br>
                        <small>{{ formatDateTime(event.startTime) }} - {{ formatDateTime(event.endTime) }}</small>
                    </v-list-item-subtitle>
                    <template v-slot:append>
                        <v-icon>mdi-chevron-right</v-icon>
                    </template>
                </v-list-item>
            </v-list>

            <v-card v-else class="text-center pa-8">
                <v-card-text>
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-calendar-blank</v-icon>
                    <h3 class="text-grey-lighten-1">No events scheduled</h3>
                </v-card-text>
            </v-card>
        </v-container>

        <!-- Event detail dialog -->
        <v-dialog v-model="detailDialog" max-width="600">
            <v-card v-if="selectedEvent">
                <v-card-title class="text-h5 d-flex align-center">
                    <v-icon class="mr-2">mdi-calendar-outline</v-icon>
                    {{ selectedEvent.title }}
                </v-card-title>

                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <h4 class="mb-2">Description</h4>
                                <p class="text-body-1">
                                    {{ selectedEvent.description || 'No description available' }}
                                </p>
                            </v-col>
                            
                            <v-col cols="12">
                                <h4 class="mb-2">Schedule</h4>
                                <v-card variant="outlined" class="pa-3">
                                    <div class="d-flex align-center mb-2">
                                        <strong>Start:</strong>
                                        <span class="ml-2">{{ formatDateTime(selectedEvent.startTime) }}</span>
                                    </div>
                                    <div class="d-flex align-center">
                                        <strong>End:</strong>
                                        <span class="ml-2">{{ formatDateTime(selectedEvent.endTime) }}</span>
                                    </div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-btn variant="text" @click="closeEventDetails">
                        Close
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn 
                        color="primary" 
                        variant="elevated"
                        @click="edit(selectedEvent)"
                        prepend-icon="mdi-pencil"
                    >
                        Edit
                    </v-btn>
                    <v-btn 
                        variant="text" 
                        icon="mdi-delete" 
                        @click="confirmDelete(selectedEvent)"
                    />
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Add/Edit Event Dialog -->
        <v-dialog v-model="dialog" max-width="600" persistent>
            <v-card>
                <v-card-title class="text-h5">
                    {{ isEditing ? 'Edit Event' : 'Add Event' }}
                </v-card-title>
                <v-card-subtitle v-if="!isEditing">
                    Create a new event
                </v-card-subtitle>

                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="record.title"
                                    label="Title"
                                    variant="outlined"
                                    :rules="inputRules"
                                    required
                                />
                            </v-col>
                            
                            <v-col cols="12">
                                <v-textarea
                                    v-model="record.description"
                                    label="Description"
                                    variant="outlined"
                                />
                            </v-col>
                            
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="record.startTime"
                                    label="Start Date and Time"
                                    type="datetime-local"
                                    variant="outlined"
                                    :rules="inputRules"
                                    required
                                />
                            </v-col>
                            
                            <v-col cols="12" md="6">
                                <v-text-field
                                    v-model="record.endTime"
                                    label="End Date and Time"
                                    type="datetime-local"
                                    variant="outlined"
                                    :rules="inputRules"
                                    required
                                />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                
                <v-card-actions>
                    <v-btn variant="text" @click="dialog = false">
                        Cancel
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn 
                        color="primary" 
                        variant="elevated"
                        @click="saveEvent"
                        :disabled="!isEventFormValid"
                        :prepend-icon="isEditing ? 'mdi-content-save' : 'mdi-check'"
                    >
                        {{ isEditing ? 'Save' : 'Create Event' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Confirm Delete Dialog -->
        <v-dialog v-model="confirmDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h5">Confirm Deletion</v-card-title>
                <v-card-text>
                    <p>Are you sure you want to delete this event "{{ itemToDelete?.title }}"?</p>
                    <span class="text-red">This action cannot be undone.</span>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="grey" text @click="confirmDialog = false">Cancel</v-btn>
                    <v-btn color="error" @click="removeEvent(itemToDelete)">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Add Button -->
        <v-btn
            color="primary"
            size="large"
            icon
            elevation="6"
            class="floating-add-btn"
            @click="add"
        >
            <v-icon size="28">mdi-plus</v-icon>
        </v-btn>
    </v-main>
</template>

<style scoped>
.floating-add-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.floating-add-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.cursor-pointer {
    cursor: pointer;
}
</style>
