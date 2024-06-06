<script>
import Bookings from './Bookings.vue'
import Stat from './Stat.vue'
export default {
  components: {
    Bookings,
    Stat,
  },
  data() {
    return {
      buttons:[
        {title:'Bookings',route:'/inlab'},
        {title:'Stat',route:'/stat'},
      ],
      page:'Bookings',
    }
  },
  methods: {
    alza() {
      this.conta++
    },
    ciaone() {
      alert('tanti saluti')
    },
  },
  mounted() {
  }
}
</script>

<template>
  <nav>
    <img src="../assets/weee.png" height="26" class="logo"/>
    <span v-for="b in buttons" @click="page=b.title" class="nav-button">{{b.title}}</span>
  </nav>
  <main>
    <h1>Grillo > {{page}}</h1>
    <Bookings v-if="page=='Bookings'"/>
    <Stat v-if="page=='Stat'"/>
  </main>
</template>