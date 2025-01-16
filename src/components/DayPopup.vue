<script setup>
import { computed } from 'vue';

const props = defineProps({
   date: { type: String, required: true},
   name: { type: String, required: true},
   percentage: { type: String, required: true},
   lowLevel: { type: Boolean, required: true},
   pay: { type: Number, required: true},
   x: { type: Number, required: true},
   y: { type: Number, required: true},
   disableHide: { type: Boolean, required: true}});

const popupStyle = computed(() => ({
  position: 'absolute',
  left: `${props.x}px`,
  top: `${props.y}px`,
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
}));
</script>

<template>
   <div class="day-popup" :style="popupStyle">
      <button v-if="props.disableHide" class="popup-close" @click="$emit('close')">×</button>
      <h2>{{ props.date }}</h2>
      <p>Parent: {{ props.name }}</p>
      <p>Percentage: {{ props.percentage }}</p>
      <p v-if="props.lowLevel">Leave type: Low level</p>
      <p v-else>Leave type: Sickness Benefit Level</p>
      <p>Pay: {{ props.pay.toFixed(0) }}</p>
   </div>
</template>

<style>
.day-popup {
   position: relative;
   z-index: 100;
   background-color: #aaa;
}

.popup-close {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  font-size: 22px;
  color: #666;
  font-weight: bold;
}

.popup-close:hover {
  color: darkred;
}

@media (prefers-color-scheme: dark) {
   .day-popup {
      background-color: #444;
   }
}
</style>