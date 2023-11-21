<script setup>
defineProps({
  msg: {
    type: String,
    required: false
  }
})
function ciaone() {
  alert('ciao claudia')
}
</script>

<template>
  <button @click="ciaone">ciaone</button>
  <button>ciaone</button>
  <button>ciaone</button>
</template>

<style>
</style>