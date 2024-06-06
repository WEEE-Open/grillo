<script setup>
// import { RouterLink, RouterView } from 'vue-router'
import { HomePage } from './components'
// import Icons from './components/icons/'
</script>
<script>
export default {
  data() {
    return {
      test:''
    }
  },
  mounted() {
    // fetch('/api/v1/ping').then(async res => {
    //   if(res.status!=200) {
    //     console.log('errore')
    //     return;
    //   }
    //   res = await res.text()
    //   this.test = res
    // })
    fetch('/api/v1/get_bookings?week=22&year=2024')
      .then(res => console.log(res))
  }
}
</script>

<template>
  <HomePage/>
  <!-- <Icons.IconDocumentation/> --> 
  {{ test }} 
</template>

<style scoped>
</style>