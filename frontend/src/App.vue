<script>
import { RouterView } from "vue-router";
import { useServer } from "./stores/server.js";
import { mapState, mapActions } from "pinia";

export default {
	components: [RouterView],
	data() {
		return {
			ready: false,
		};
	},
	computed: {
		...mapState(useServer, ["initiated", "valid", "blocked"]),
	},
	methods: {
		...mapActions(useServer, ["init", "logout"]),
		async handleLogout() {
			this.ready = false;
			await this.logout();
			this.$router.go();
		},
	},
	async mounted() {
		await this.init();
		if (!this.initiated) {
			//
		} else if (this.valid) {
			this.ready = true;
		} else if (this.blocked) {
			// lmao rip
		} else {
			window.location.href = "/api/v1/login?return=%2F"; // this endpoint will take care of redirecting us
		}
	},
};
</script>

<template>
	<v-app>
		<v-app-bar flat v-if="ready && !blocked && initiated">
			<v-container class="mx-auto d-flex align-center justify-center ga-10" :max-width="1200">
				<v-tabs
					:model-value="$route.name"
					@update:model-value="$router.push({ name: $event })"
					color="primary"
					:mandatory="false"
				>
					<v-tab value="home" to="/"><v-img
							src="/weee.png"
							title="logo"
							alt="home"
							:height="36"
							:min-width="195"
							:max-width="300"
					/></v-tab>
					<v-tab value="schedule" to="/schedule">Schedule</v-tab>
					<v-tab value="logs" to="/logs">Logs</v-tab>
					<v-tab value="settings" to="/settings">Settings</v-tab>
				</v-tabs>
				<v-spacer></v-spacer>
				<v-dialog max-width="500">
					<template v-slot:activator="{ props: activatorProps }">
						<v-btn text="Logout" variant="text" v-bind="activatorProps" />
					</template>

					<template v-slot:default="{ isActive }">
						<v-card title="Dialog">
							<v-card-text> Confirm logout? </v-card-text>

							<v-card-actions>
								<v-btn text="Go back" @click="isActive.value = false" />
								<v-spacer></v-spacer>
								<v-btn text="Yes, logout" @click="handleLogout" color="error" />
							</v-card-actions>
						</v-card>
					</template>
				</v-dialog>
			</v-container>
		</v-app-bar>
		<v-container v-if="!ready" class="h-100 d-flex flex-column justify-center align-center">
			<v-progress-circular size="64" :indeterminate="true" />
		</v-container>
		<div v-else-if="blocked">You blocked foo</div>
		<div v-else-if="!initiated">
			Couldn't connect to server, are you offline or did the datacenter explode again?
		</div>
		<template v-else-if="$route.name == 'home'">
			<v-main height="100%">
				<div
					class="h-100 d-flex align-center justify-center justify-sm-start pl-sm-16"
					style="background: url(/background.jpg) no-repeat center; background-size: cover"
				>
					<v-card
						title="Accedi agli altri servizi del team"
						variant="elevated"
						class="pa-5 w-50"
						max-width="600"
						min-width="400"
					>
						<v-card
							prepend-icon="mdi-circle-double"
							variant="tonal"
							title="Tarallo"
							subtitle="Tuttofare Assistente il Riuso di Aggeggi Logori e Localmente Opprimenti (aka L'inventario Opportuno)"
							append-icon="mdi-chevron-right"
							href="https://tarallo.weeeopen.it/"
						/>
						<v-card
							prepend-icon="mdi-account-outline"
							variant="tonal"
							title="Crauto"
							subtitle="Creatore e Rimuovitore Autogestito di Utenti che Tutto Offre"
							append-icon="mdi-chevron-right"
							href="https://tarallo.weeeopen.it/"
							class="mt-5"
						/>
						<v-card
							prepend-icon="mdi-cloud-outline"
							variant="tonal"
							title="Cloud"
							subtitle="Cumulatore Ludico Ostinatamente Utile di Dati"
							append-icon="mdi-chevron-right"
							href="https://tarallo.weeeopen.it/"
							class="mt-5"
						/>
						<v-card
							prepend-icon="mdi-book-outline"
							variant="tonal"
							title="Wiki"
							subtitle="Wisdom Integrata per la Konoscenza Illimitata"
							append-icon="mdi-chevron-right"
							href="https://tarallo.weeeopen.it/"
							class="mt-5"
						/>
					</v-card>
				</div>
			</v-main>
		</template>
		<RouterView />
	</v-app>
</template>
