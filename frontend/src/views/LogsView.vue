<script>
import CreateAudit from "@/dialogs/CreateAudit.vue";
import { useServer } from "../stores/server";
import { mapActions } from "pinia";

export default {
	inject: ["dialog"],
	data() {
		return {
			focus: new Date(),
			loading: false,
			audits: [],
			locations: [],
		};
	},
	mounted() {
		this.fetchLocations();
	},
	watch: {
		focus: {
			async handler(newFocus, oldFocus) {
				if (newFocus !== oldFocus) {
					let startOfTheMonth = new Date(newFocus);
					startOfTheMonth.setDate(1);
					startOfTheMonth.setHours(0, 0, 0, 0);
					let endOfTheMonth = new Date(newFocus);
					endOfTheMonth.setMonth(endOfTheMonth.getMonth() + 1);
					endOfTheMonth.setDate(0);
					endOfTheMonth.setHours(23, 59, 59, 0);

					this.loading = true;
					await this.getAudits({
						startTime: startOfTheMonth,
						endTime: endOfTheMonth,
					})
						.then(res => {
							this.audits = res;
						})
						.finally(() => {
							this.loading = false;
						});
				}
			},
			immediate: true,
		},
	},
	methods: {
		...mapActions(useServer, ["getAudits", "getLocations"]),

		async fetchLocations() {
			try {
				this.locations = await this.getLocations();
			} catch (error) {
				console.log("Locations fetch failed: ", error);
			}
		},

		openAddAuditDialog() {
			this.dialog(CreateAudit, {
				locations: this.locations,
			});
		},
	},
};
</script>
<template>
	<v-main>
		<v-sheet class="h-100" v-if="loading">
			<v-empty-state>
				<v-progress-circular size="64" indeterminate />
			</v-empty-state>
		</v-sheet>
		<v-container
			class="h-100 d-flex justify-center align-center flex-column"
			v-else-if="audits.length == 0"
		>
			<v-icon :size="128" icon="mdi-image-filter-hdr-outline" />
			<div class="text-tile">No audits this month</div>
		</v-container>
		<v-container class="h-100" v-else>
			<v-list rounded>
				<v-divider>April 1st 2026</v-divider>
				<v-list-item
					v-for="audit in audits"
					:title="audit.user.printableName"
					:subtitle="
						audit.location.name +
						', ' +
						audit.startTime +
						' - ' +
						audit.endTime +
						(audit.approved ? '' : ', unapproved')
					"
					prepend-icon="mdi-account-outline"
				/>
			</v-list>
		</v-container>

		<v-fab
			v-if="!loading"
			color="green"
			app
			location="bottom right"
			elevation="5"
			size="large"
			icon="mdi-plus"
			@click="openAddAuditDialog"
		/>
	</v-main>
</template>
