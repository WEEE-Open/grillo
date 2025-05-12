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
        <v-tabs
            v-model="$route.name"
			@update:model-value="console.log($event);$router.push({ name: $event })"
            color="primary"
            direction="vertical"
        >
            <v-tab prepend-icon="mdi-map-marker-outline" value="locations">Locations</v-tab>
            <v-tab prepend-icon="mdi-key-outline" value="tokens">Api Tokens</v-tab>
        </v-tabs>
        <RouterView />
    </v-main>
</template>