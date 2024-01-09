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
            // const now = dayjs()
            // if(date.year()===now.year()) {
            //     if(date.dayOfYear()-now.dayOfYear()==0) return 'today at '
            //     if(date.dayOfYear()-now.dayOfYear()==1) return 'tomorrow at '
            //     if(date.dayOfYear()-now.dayOfYear()>1) return 'on '+' at '
            // }
            // console.log(date.diff(now,'day'))

            // if(date.getFullYear()===today.getFullYear && date.getMonth()===today.getMonth()) {
            //     console.log('ciao')
            //     if(date.getDate()===today.getDate()) console.log('yes')
            // } else console.log('no')
        },
        printDate(date) {
            return date.format('DD/MM/YYYY')
            // return date.getDate().toString().padStart(2,'0')
            //     +'/'+(date.getMonth()+1).toString().padStart(2,'0')
            //     +'/'+date.getFullYear().toString().padStart(4,'0')
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
    <!-- <span v-for="b in nextBookings().filter(b => b.time.isToday())">{{ b.user }} today at {{ printTime(b.time) }}<br/></span>
    <span v-for="b in nextBookings().filter(b => b.time.isTomorrow())">{{ b.user }} tomorrow at {{ printTime(b.time) }}<br/></span> -->

    <span v-for="b in nextBookings()">- {{ b.user+' '+compare(b.time)+' at '+printTime(b.time) }}<br/></span>

    <!-- <span v-for="b in bookings">{{ b.user+': '+printDate(b.time)+' at '+printTime(b.time) }}<br/></span> -->
    <br/><br/><br/><br/>
    <button @click="compare(bookings[1].time)">new</button>
</template>