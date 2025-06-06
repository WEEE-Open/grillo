<script>
import { RouterView } from "vue-router";
import { useServer } from "./stores/server.js";
import { mapState, mapActions } from "pinia";

export default {
	components: [RouterView],
	data() {
		return {
			width: 1920,
			height: 1080,
			ready: false,
			isLabOpen: true,
			peopleInLab: ["Enrico Franicscono", "Lorenzo Filomena"],
			ringLastPress: null,
			ringCooldown: null,
			now: Date.now(),
			nowInterval: null,
		};
	},
	computed: {
		...mapState(useServer, ["initiated", "valid", "blocked", "session", "servicesLinks"]),
		peopleInLabList() {
			if (this.peopleInLab.length == 1) return this.peopleInLab[0];
			if (this.peopleInLab.length > 10)
				return (
					this.peopleInLab.slice(0, 9).join(", ") +
					" and " +
					(this.peopleInLab.length - 9) +
					" other"
				);
			return (
				this.peopleInLab.slice(0, -1).join(", ") +
				" and " +
				this.peopleInLab[this.peopleInLab.length - 1]
			);
		},
		showRingTooltip: {
			get() {
				return this.now - this.ringLastPress < 5000;
			},
			set() {},
		},
	},
	methods: {
		...mapActions(useServer, ["init", "logout", "ring"]),
		handleResize() {
			this.width = window.innerWidth;
			this.height = window.innerHeight;
		},
		async handleLogout() {
			this.ready = false;
			await this.logout();
			this.$router.go();
		},
		async handleRing() {
			if (this.ringLastPress == null || Date.now() - this.ringLastPress > 5000) {
				this.ringLastPress = Date.now();
			} else {
				this.ring();
				this.ringLastPress = null;
				this.ringCooldown = Date.now() + 5000;
			}
		},
		handleClickOutsite() {
			if (this.showRingTooltip) this.ringLastPress -= 5000;
		},
	},
	async mounted() {
		await this.init();
		if (!this.initiated) {
			//
		} else if (this.valid) {
			this.ready = true;
			this.nowInterval = setInterval(() => {
				this.now = Date.now();
			}, 100);
		} else if (this.blocked) {
			// lmao rip
		} else {
			window.location.href = "/api/v1/login?return=%2F"; // this endpoint will take care of redirecting us
		}
	},
	beforeUnmound() {
		clearTimeout(this.nowInterval);
	},
};
</script>

<template>
	<v-app v-resize="handleResize">
		<v-app-bar class="d-none d-sm-flex" flat v-if="ready && !blocked && initiated">
			<v-container class="mx-auto d-flex align-center justify-center ga-10" :max-width="1200">
				<v-tabs
					:model-value="$route.matched[0].name"
					@update:model-value="$router.push({ name: $event })"
					color="primary"
					:mandatory="false"
				>
					<v-tab value="home" to="/"
						><v-img
							src="/weee.png"
							title="logo"
							alt="home"
							:height="36"
							:min-width="195"
							:max-width="300"
					/></v-tab>
					<v-tab value="schedule" to="/schedule">Schedule</v-tab>
					<v-tab value="logs" to="/logs">Logs</v-tab>
					<v-tab value="events" to="/events" v-if="session.isAdmin">Events</v-tab>
					<v-tab value="settings-parent" to="/settings" v-if="session.isAdmin">Settings</v-tab>
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
			<v-main v-if="width > 600" class="h-100">
				<div
					class="h-100 w-100 d-flex flex-column justify-center pl-sm-16"
					style="background: url(/background.jpg) no-repeat center; background-size: cover"
				>
					<v-card
						variant="elevated"
						class="pa-5 w-50 position-relative"
						max-width="700"
						min-width="400"
					>
						<template v-if="isLabOpen">
							<div class="text-h6">
								The lab is currently <span class="text-success text-bold">open</span> and there
								<template v-if="peopleInLab.length == 1">
									is
									<v-tooltip :text="peopleInLabList" location="bottom" max-width="300">
										<template #activator="{ props }"><span v-bind="props">1 person</span></template>
									</v-tooltip>
									present.
								</template>
								<template v-else>
									are
									<v-tooltip :text="peopleInLabList" location="bottom" max-width="300">
										<template #activator="{ props }"
											><span v-bind="props">{{ peopleInLab.length }} people</span></template
										>
									</v-tooltip>
									present.
								</template>
							</div>
						</template>
						<template v-else>
							<v-card-title>
								The lab is currently <span class="text-error text-bold">closed</span>.
							</v-card-title>
						</template>
						<v-card-actions v-if="isLabOpen">
							<v-spacer></v-spacer>
							<v-tooltip
								text="Press twice to ring"
								location="right"
								:open-on-hover="false"
								:model-value="showRingTooltip"
								@click:outside="handleClickOutsite"
							>
								<template #activator="{ props }">
									<v-btn
										v-bind="props"
										:icon="true"
										@click="handleRing()"
										:disabled="ringCooldown > now"
										class="position-relative"
									>
										<template v-if="now - ringLastPress < 5000">
											<v-progress-circular size="48" :model-value="(now - ringLastPress) / 50" />
											<div class="position-absolute">
												<v-icon class="ring" icon="mdi-bell-outline" />
											</div>
										</template>
										<template v-else-if="ringCooldown > now">
											<v-progress-circular size="48" :model-value="(ringCooldown - now) / 50" />
											<div class="position-absolute">
												<v-icon class="ring" icon="mdi-bell-outline" />
											</div>
										</template>
										<template v-else>
											<v-icon icon="mdi-bell-outline" />
										</template>
									</v-btn>
								</template>
							</v-tooltip>
						</v-card-actions>
					</v-card>
					<v-card
						v-if="servicesLinks.length != 0"
						title="Access other services"
						variant="elevated"
						class="mt-5 pa-5 w-50"
						max-width="700"
						min-width="400"
					>
						<v-card
							v-for="(service, i) in servicesLinks"
							:prepend-icon="service.icon"
							variant="tonal"
							:title="service.title"
							:subtitle="service.subtitle"
							append-icon="mdi-chevron-right"
							:href="service.link"
							:class="{ 'mt-5': i != 0 }"
						/>
					</v-card>
				</div>
			</v-main>
			<v-main
				v-else
				class="h-100 justify-center"
				style="
					display: grid;
					grid-template-columns: repeat(auto-fill, 128px);
					gap: 32px;
					align-content: center;
				"
			>
				<v-btn
					prepend-icon="mdi-calendar-outline"
					variant="text"
					stacked
					style="width: 128px; height: 128px"
					text="Schedule"
					size="xl"
					to="/schedule"
				/>
				<v-btn
					prepend-icon="mdi-format-list-bulleted"
					variant="text"
					stacked
					style="width: 128px; height: 128px"
					text="Log"
					size="xl"
					to="/logs"
				/>
				<v-tooltip
					text="Press twice to ring"
					location="top"
					:open-on-hover="false"
					:model-value="showRingTooltip"
					@click:outside="handleClickOutsite"
				>
					<template #activator="{ props }">
						<v-btn
							v-bind="props"
							variant="text"
							stacked
							style="width: 128px; height: 128px"
							text="Ring"
							size="xl"
							@click="handleRing()"
							:disabled="ringCooldown > now"
						>
							<template #prepend>
								<v-icon
									icon="mdi-bell-outline"
									:class="{ ring: now - ringLastPress < 5000 || ringCooldown > now }"
								/>
							</template>
							<v-progress-linear
								v-if="now - ringLastPress < 5000"
								:model-value="(now - ringLastPress) / 50"
								absolute
								rounded
								class="w-50 mt-4"
							/>
							<v-progress-linear
								v-else-if="ringCooldown > now"
								:model-value="(ringCooldown - now) / 50"
								absolute
								rounded
								class="w-50 mt-4"
							/>
							Ring
						</v-btn>
					</template>
				</v-tooltip>
				<v-btn
					prepend-icon="mdi-calendar-star"
					variant="text"
					stacked
					style="width: 128px; height: 128px"
					text="Events"
					size="xl"
					to="/events"
					v-if="session.isAdmin"
				/>
				<v-btn
					prepend-icon="mdi-cog-outline"
					variant="text"
					stacked
					style="width: 128px; height: 128px"
					text="Settings"
					size="xl"
					to="/settings"
					v-if="session.isAdmin"
				/>
				<v-btn
					v-for="service in servicesLinks"
					:prepend-icon="service.icon"
					variant="text"
					stacked
					style="width: 128px; height: 128px"
					:text="service.title"
					size="xl"
					:href="service.link"
				/>
			</v-main>
		</template>
		<RouterView v-if="ready" />
	</v-app>
</template>
<style>
.ring {
	-webkit-animation: ring 4s 0.7s ease-in-out infinite;
	-webkit-transform-origin: 50% 4px;
	-moz-animation: ring 4s 0.7s ease-in-out infinite;
	-moz-transform-origin: 50% 4px;
	animation: ring 4s 0.7s ease-in-out infinite;
	transform-origin: 50% 4px;
}

@-webkit-keyframes ring {
	0% {
		-webkit-transform: rotateZ(0);
	}

	1% {
		-webkit-transform: rotateZ(30deg);
	}

	3% {
		-webkit-transform: rotateZ(-28deg);
	}

	5% {
		-webkit-transform: rotateZ(34deg);
	}

	7% {
		-webkit-transform: rotateZ(-32deg);
	}

	9% {
		-webkit-transform: rotateZ(30deg);
	}

	11% {
		-webkit-transform: rotateZ(-28deg);
	}

	13% {
		-webkit-transform: rotateZ(26deg);
	}

	15% {
		-webkit-transform: rotateZ(-24deg);
	}

	17% {
		-webkit-transform: rotateZ(22deg);
	}

	19% {
		-webkit-transform: rotateZ(-20deg);
	}

	21% {
		-webkit-transform: rotateZ(18deg);
	}

	23% {
		-webkit-transform: rotateZ(-16deg);
	}

	25% {
		-webkit-transform: rotateZ(14deg);
	}

	27% {
		-webkit-transform: rotateZ(-12deg);
	}

	29% {
		-webkit-transform: rotateZ(10deg);
	}

	31% {
		-webkit-transform: rotateZ(-8deg);
	}

	33% {
		-webkit-transform: rotateZ(6deg);
	}

	35% {
		-webkit-transform: rotateZ(-4deg);
	}

	37% {
		-webkit-transform: rotateZ(2deg);
	}

	39% {
		-webkit-transform: rotateZ(-1deg);
	}

	41% {
		-webkit-transform: rotateZ(1deg);
	}

	43% {
		-webkit-transform: rotateZ(0);
	}

	100% {
		-webkit-transform: rotateZ(0);
	}
}

@-moz-keyframes ring {
	0% {
		-moz-transform: rotate(0);
	}

	1% {
		-moz-transform: rotate(30deg);
	}

	3% {
		-moz-transform: rotate(-28deg);
	}

	5% {
		-moz-transform: rotate(34deg);
	}

	7% {
		-moz-transform: rotate(-32deg);
	}

	9% {
		-moz-transform: rotate(30deg);
	}

	11% {
		-moz-transform: rotate(-28deg);
	}

	13% {
		-moz-transform: rotate(26deg);
	}

	15% {
		-moz-transform: rotate(-24deg);
	}

	17% {
		-moz-transform: rotate(22deg);
	}

	19% {
		-moz-transform: rotate(-20deg);
	}

	21% {
		-moz-transform: rotate(18deg);
	}

	23% {
		-moz-transform: rotate(-16deg);
	}

	25% {
		-moz-transform: rotate(14deg);
	}

	27% {
		-moz-transform: rotate(-12deg);
	}

	29% {
		-moz-transform: rotate(10deg);
	}

	31% {
		-moz-transform: rotate(-8deg);
	}

	33% {
		-moz-transform: rotate(6deg);
	}

	35% {
		-moz-transform: rotate(-4deg);
	}

	37% {
		-moz-transform: rotate(2deg);
	}

	39% {
		-moz-transform: rotate(-1deg);
	}

	41% {
		-moz-transform: rotate(1deg);
	}

	43% {
		-moz-transform: rotate(0);
	}

	100% {
		-moz-transform: rotate(0);
	}
}

@keyframes ring {
	0% {
		transform: rotate(0);
	}

	1% {
		transform: rotate(30deg);
	}

	3% {
		transform: rotate(-28deg);
	}

	5% {
		transform: rotate(34deg);
	}

	7% {
		transform: rotate(-32deg);
	}

	9% {
		transform: rotate(30deg);
	}

	11% {
		transform: rotate(-28deg);
	}

	13% {
		transform: rotate(26deg);
	}

	15% {
		transform: rotate(-24deg);
	}

	17% {
		transform: rotate(22deg);
	}

	19% {
		transform: rotate(-20deg);
	}

	21% {
		transform: rotate(18deg);
	}

	23% {
		transform: rotate(-16deg);
	}

	25% {
		transform: rotate(14deg);
	}

	27% {
		transform: rotate(-12deg);
	}

	29% {
		transform: rotate(10deg);
	}

	31% {
		transform: rotate(-8deg);
	}

	33% {
		transform: rotate(6deg);
	}

	35% {
		transform: rotate(-4deg);
	}

	37% {
		transform: rotate(2deg);
	}

	39% {
		transform: rotate(-1deg);
	}

	41% {
		transform: rotate(1deg);
	}

	43% {
		transform: rotate(0);
	}

	100% {
		transform: rotate(0);
	}
}
</style>
