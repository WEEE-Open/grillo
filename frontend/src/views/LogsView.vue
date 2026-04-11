<script>
import CreateEditAudit from "@/dialogs/CreateEditAudit.vue";
import { useServer } from "../stores/server";
import { mapActions, mapState } from "pinia";
import ViewAudit from "@/dialogs/ViewAudit.vue";
import { formatHms } from "@/plugins/utils";

export default {
	inject: ["dialog"],
	data() {
		return {
			focus: new Date(),
			loading: false,
			audits: [],
		};
	},
	computed: {
		...mapState(useServer, ["session", "locations"]),
		startOfTheMonth() {
			let startOfTheMonth = new Date(this.focus);
			startOfTheMonth.setDate(1);
			startOfTheMonth.setHours(0, 0, 0, 0);
			return startOfTheMonth;
		},
		endOfTheMonth() {
			let endOfTheMonth = new Date(this.focus);
			endOfTheMonth.setMonth(endOfTheMonth.getMonth() + 1);
			endOfTheMonth.setDate(0);
			endOfTheMonth.setHours(23, 59, 59, 0);
			return endOfTheMonth;
		},
		grouppedAudits() {
			let days = {};
			let date = new Date(this.focus);
			let month = date.getMonth();
			date.setDate(1);
			date.setHours(0, 0, 0, 0);
			while (date.getMonth() === month) {
				const formatted = date.toISOString().split('T')[0];
				days[formatted] = [];
				date.setDate(date.getDate() + 1);
			}
			this.audits.forEach(audit => {
				const date = new Date(audit.startTime * 1000);
				const key = date.toISOString().split('T')[0];
				days[key].push(audit);
			});
			return Object.entries(days).map(([key, value]) => {
				const date = new Date(key);
				const audits = value.map(a => {
					const startDate = new Date(a.startTime * 1000);
					const endDate = new Date(a.endTime * 1000);
					const totalSeconds = a.endTime - a.startTime;
					return {
						...a,
						formattedStartTime: startDate.getHours() + ":" + ("" + startDate.getMinutes()).padStart(2, "0"),
						formattedEndTime: endDate.getHours() + ":" + ("" + endDate.getMinutes()).padStart(2, "0"),
						formattedEndDate: endDate.getDate() + "/" + ("" + endDate.getMonth()).padStart(2, "0") + "/" + endDate.getFullYear(),
						isAcrossMultipleDays: startDate.getDate() != endDate.getDate(),
						totalSeconds,
						formattedTotalTime: formatHms(totalSeconds),
					}
				});
				return {
					date,
					weekDay: date.getDay(),
					day: date.getDate(),
					month: date.getMonth(),
					year: date.getFullYear(),
					totalSeconds: audits.reduce((t, n) => t+n, 0),
					audits,
				}
			});
		},
	},
	watch: {
		focus: {
			handler(newFocus, oldFocus) {
				if (newFocus !== oldFocus) {
					this.fetchAudits();
				}
			},
			immediate: true,
		},
	},
	methods: {
		...mapActions(useServer, ["getAudits"]),

		async fetchAudits() {
			this.loading = true;
			await this.getAudits({
				startTime: this.startOfTheMonth,
				endTime: this.endOfTheMonth,
			})
				.then(res => {
					this.audits = res;
					this.audits.sort((a, b) => a.startTime > b.startTime);
				})
				.finally(() => {
					this.loading = false;
				});
		},

		async openAddAuditDialog() {
			this.dialog(CreateEditAudit, {
				locations: this.locations,
			});
			this.fetchAudits();
		},

		nextMonth() {
			const date = new Date(this.focus)
			date.setMonth(this.focus.getMonth() + 1);
			this.focus = date;
		},

		prevMonth() {
			const date = new Date(this.focus)
			date.setMonth(this.focus.getMonth() - 1);
			this.focus = date;
		},

		async viewAudit(id) {
			const audit = this.audits.find(a => a.id == id);
			if (!audit) return;
			await this.dialog(ViewAudit, {audit});
			this.fetchAudits();
		},
	},
};
</script>
<template>
	<v-main>
		<v-container class="h-100">
			<v-card rounded class="mb-4 pa-4 d-flex justify-center align-center" :loading="loading">
				<v-btn icon="mdi-chevron-left" variant="text" @click="prevMonth" />
				<div class="text-headline-small flex-grow-1 text-center">
					{{ ["January","February","March","April","May","June","July","August","September","October","November","December"][this.focus.getMonth()] + " " + this.focus.getFullYear() }}
				</div>
				<v-btn icon="mdi-chevron-right" variant="text" @click="nextMonth" />
			</v-card>
			<template v-if="!loading">
				<v-container v-if="audits.length == 0" class="h-50 d-flex justify-center align-center flex-column">
					<v-icon :size="128" icon="mdi-image-filter-hdr-outline" />
					<div class="text-tile">No audits this month</div>
				</v-container>
				<v-card v-else>
					<v-list rounded>
						<template v-for="dayAudits in grouppedAudits" :key="dayAudits.date" >
							<v-divider v-if="dayAudits.audits.length != 0">{{ ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayAudits.weekDay] }}, {{ dayAudits.day }} {{ ["January","February","March","April","May","June","July","August","September","October","November","December"][dayAudits.month] }} {{ dayAudits.year }}</v-divider>
							<v-list-item
								v-for="audit in dayAudits.audits"
								:title="audit.user.printableName"
								:subtitle="
									audit.location.name +
									', ' +
									audit.formattedStartTime +
									' - ' +
									(audit.isAcrossMultipleDays ? audit.formattedEndDate : '') +
									' ' +
									audit.formattedEndTime +
									' (' +
									audit.formattedTotalTime.trim() +
									')' +
									(audit.approved ? '' : ', unapproved')
								"
								prepend-icon="mdi-account-outline"
								link
								@click="viewAudit(audit.id)"
							/>
						</template>
					</v-list>
				</v-card>
			</template>
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
