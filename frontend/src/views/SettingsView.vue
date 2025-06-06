<script>
import { toRaw } from "vue";
import { RouterView } from "vue-router";

export default {
	components: { RouterView },
	mounted() {
	},
};
</script>
<template>
	<v-main>
		<v-container fluid>
			<v-row class="d-md-none">
				<v-tabs
					v-model="$route.name"
					@update:model-value="$router.push({ name: $event })"
					color="primary"
				>
					<v-tab prepend-icon="mdi-map-marker-outline" value="locations">Locations</v-tab>
					<v-tab prepend-icon="mdi-key-outline" value="tokens">Api Tokens</v-tab>
				</v-tabs>
			</v-row>
			<v-row>
				<v-col cols="auto" class="d-none d-md-flex">
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
