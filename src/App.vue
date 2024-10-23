<script setup>
import Calendar from './components/Calendar.vue';
</script>

<template>
  <div id="app">
    <h1>Föräldraledighetskalender</h1><br>
    <div id="calendar-div">
    <Calendar />
    </div>
  </div>
</template>

<style>
  /* Global styles */
  #calendar-div {
    width: 60%;
    height: 40rem;
  }
</style>