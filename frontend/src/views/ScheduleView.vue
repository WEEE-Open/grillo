<script>
import { VCalendar } from 'vuetify/labs/VCalendar'

export default {
	components: {
		VCalendar
	},
	data() {
		let now = new Date();
		let soon = new Date();
		soon.setHours(soon.getHours() + 2);
		return {
			events: [
				{
					title: "asd",
					start: now,
					end: soon,
					color: "green",
					allDay: false,
				}
			]
		}
	}
};
</script>
<template>
	<v-main>
		<v-sheet>
			<VCalendar :events="events" view-mode="week" :weekdays="[0, 1, 2, 3, 4, 5, 6]" :interval-duration="2*60"/>
		</v-sheet>
	</v-main>
</template>
