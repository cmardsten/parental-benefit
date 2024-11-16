<script setup>
import Calendar from './components/Calendar.vue';
</script>

<template>
  <div id="app">
    <h1> {{ $t('parentalLeaveCalendar') }}</h1><br>
    <div id="calendar-div">
    <Calendar />
    </div>
  </div>
</template>

<style>
  /* Global styles */
</style>