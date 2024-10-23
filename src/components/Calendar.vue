  <script setup>
  import { ref, defineComponent } from 'vue';
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';
  
    let calApi = null;

    const currentView = ref('dayGridMonth');
    const events = [
        { title: 'Event 1', date: '2024-10-15' },
        { title: 'Event 2', date: '2024-10-28' },
        { title: 'Event 3', date: '2024-10-28' }];
    const calendarOptions = ref({
            plugins: [ dayGridPlugin, interactionPlugin ],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },
            events: events,
      });

    const onDatesSet = (dateInfo) => {
    // Logic for handling date changes
    console.log('Current date range:', dateInfo.start, dateInfo.end);
    };

    const renderYearView = () => {
    // Logic to render the year view (can be extended)
    console.log('Year view triggered');
    };
  </script>

<template>
    <div>
        <FullCalendar :options="calendarOptions" />
    </div>
  </template>
  
  <style>
  /* Add your styles here */
  </style>
  