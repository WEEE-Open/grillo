<script>
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
dayjs.extend(dayOfYear)
dayjs.extend(isToday)
dayjs.extend(isTomorrow)
export default {
    data() {
        return {
            bookings: [
                {user:'Enrico Franciscono',time:dayjs()},
                {user:'Donato Modugno',time:dayjs().add(2,'h')},
                {user:'Francesco Basile',time:dayjs().add(1,'d')},
                {user:'Cataldo Basile',time:dayjs().add(2,'d')},
            ],
        }
    },
    methods: {
        nextBookings() {
            return this.bookings.filter(b => b.time.isAfter(dayjs()))
        },
        compare(date) {
            if(date.isToday()) return 'today'
            else if(date.isTomorrow()) return 'tomorrow'
            else return 'on '+date.format('YYYY-MM-DD')
        },
        printDate(date) {
            return date.format('DD/MM/YYYY')
        },
        printTime(date) {
            return date.format('HH:mm')
        },
    },
    computed: {
    },
    mounted() {
    }
}
</script>

<template>
    There are {{ nextBookings().length }} students that are going to lab:<br/>
    <br/>
    <span v-for="b in nextBookings()">- {{ b.user+' '+compare(b.time)+' at '+printTime(b.time) }}<br/></span>
</template>