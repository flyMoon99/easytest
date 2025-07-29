<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
#app {
  padding: 20px;
  text-align: center;
  font-family: Arial, sans-serif;
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
}

button:hover {
  background: #2563eb;
}
</style> 