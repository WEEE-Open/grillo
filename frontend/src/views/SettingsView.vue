<script>
import { toRaw } from 'vue';
import { RouterView } from 'vue-router';

export default {
    components: { RouterView },
    mounted() {
        console.log(toRaw(this.$route.name));
    }
}
</script>
<template>
    <v-main>
        <v-container>
            <v-row>
                <v-col cols="3">
                    <v-tabs
                        v-model="$route.name"
                        @update:model-value="$router.push({ name: $event })"
                        color="primary"
                        direction="vertical"
                    >
                        <v-tab prepend-icon="mdi-map-marker-outline" value="locations">Locations</v-tab>
                        <v-tab prepend-icon="mdi-key-outline" value="tokens">Api Tokens</v-tab>
                    </v-tabs>
                </v-col>
                <v-col>
                    <RouterView />
                </v-col>
            </v-row>
        </v-container>
    </v-main>
</template>