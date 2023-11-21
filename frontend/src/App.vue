<script setup>
// import { RouterLink, RouterView } from 'vue-router'
import { HomePage } from './components'
import Icons from './components/icons/'
const buttons = [
  {title:'Bookings',route:'/inlab'},
  {title:'Stat',route:'/stat'},
]
</script>

<template>
  <nav>
    <img src="./assets/weee.png" height="26" class="logo"/>
    <span v-for="b in buttons">{{b.title}}</span>
  </nav>
  <main>
    <h1>Grillo</h1>
  </main>
  <!-- <HomePage/>
  <br/>
  <Icons.IconDocumentation/>
  <Icons.IconDocumentation/>
  <Icons.IconDocumentation/>
  <Icons.IconDocumentation/> -->
  
</template>

<style scoped>
</style>