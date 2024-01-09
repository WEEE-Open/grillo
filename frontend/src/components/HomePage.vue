<script>
import Bookings from './Bookings.vue'
export default {
  components: {
    Bookings
  },
  data() {
    return {
      buttons: [
        {title:'Bookings',route:'/inlab'},
        {title:'Stat',route:'/stat'},
      ]
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
    <span v-for="b in buttons">{{b.title}}</span>
  </nav>
  <main>
    <h1>Grillo</h1>
    <Bookings/>
  </main>
</template>