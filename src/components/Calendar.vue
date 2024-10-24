  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';


      const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      var pattern = ref({
        Monday: "100",
        Tuesday: "100",
        Wednesday: "100",
        Thursday: "100",
        Friday: "100",
        Saturday: "100",
        Sunday: "100",
      });
      const repeatDuration = ref(1);  // Number of weeks to repeat
      const selectedPerson = ref(null);
      const events = ref([{ title: '100% 871 kr', date: '2024-10-15', color: 'red'}]);  // Holds generated events
      const ratios = [
        { id: 1, ratio: '100' },
        { id: 2, ratio: '75' },
        { id: 3, ratio: '50' },
        { id: 4, ratio: '25' },
        { id: 5, ratio: '12.5' },
        { id: 6, ratio: '0' },
    ];
      const persons = [
        { id: 1, name: 'Richard' },
        { id: 2, name: 'Linnea' },
      ];
      
    const calendarOptions = computed(() => ({
            ...FullCalendar.options,
            plugins: [ dayGridPlugin, interactionPlugin ],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },
            events: events.value,
      }));

    const onDatesSet = (dateInfo) => {
        // Logic for handling date changes
        console.log('Current date range:', dateInfo.start, dateInfo.end);
    };

    const renderYearView = () => {
        // Logic to render the year view (can be extended)
        console.log('Year view triggered');
    };

    const generatePattern = () => {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Start of the week (Monday)
      
      // Loop over the number of weeks based on repeatDuration
      for (let week = 0; week < repeatDuration.value; week++) {
        weekDays.forEach((day, index) => {
          const percentage = pattern.value[day];
          if (percentage > 0)
          {
            const eventDate = new Date(startOfWeek);
            eventDate.setDate(eventDate.getDate() + index + week * 7); // Calculate the correct date for each day

            events.value.push({
                title: `${selectedPerson.value[0]} ${percentage}%`,
                start: eventDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
                person: selectedPerson.value,
                percentage});
          }
        });
      }
    }

    const saveCalendar = () => {
      localStorage.setItem('savedEvents', JSON.stringify(events.value));
      alert('Calendar events saved!');
    };

    // Load events from Local Storage
    const loadCalendar = () => {
      const savedEvents = localStorage.getItem('savedEvents');
      if (savedEvents) {
        events.value = JSON.parse(savedEvents);
        alert('Calendar events loaded!');
      } else {
        alert('No saved calendar found.');
      }
    };

    // Clear events from Local Storage and events ref
    const clearCalendar = () => {
      events.value = [];
    }

    // Load events automatically when the component is mounted
    onMounted(() => {
      loadCalendar();
    });
  </script>

<template>
    <div>
        <button @click="saveCalendar">Save Calendar</button>
        <button @click="loadCalendar">Load Calendar</button>
        <button @click="clearCalendar">Clear Calendar</button>
        <FullCalendar :options="calendarOptions" />
        <form @submit.prevent="generatePattern">
        <h3>Weekly Pattern</h3>
        <div v-for="day in weekDays" :key="day">
        <label :for="day">{{ day }}</label>
        <select v-model="pattern[day]">
        <option v-for="ratio in ratios" :key="ratio.id" :value="ratio.ratio">{{ ratio.ratio }}</option>
        </select>
        </div>
        <!-- Repeat Duration -->
      <label for="repeatDuration">Repeat for (weeks):</label>
      <input type="number" v-model="repeatDuration" min="1" placeholder="Number of weeks" />
        <!-- Person Selector -->
        <label for="person">Select Person:</label>
        <select v-model="selectedPerson">
            <option v-for="person in persons" :key="person.id" :value="person.name">{{ person.name }}</option>
         </select>
        <button type="submit">Generate Pattern</button>
        </form>
        <div v-if="events.length">
      <h3>Generated Events</h3>
      <ul>
        {{ events }}
        <li v-for="event in events" :key="event.title">
          {{ event.title }} - {{ event.start }} ({{ event.percentage }}%)
        </li>
      </ul>
    </div>
    </div>
  </template>
  
  <style>
  .person-richard {
  background-color: #00BFFF !important;
  border-color: #00BFFF !important;
  color: white !important;
}

.person-linnea {
  background-color: lightcoral !important;
  border-color: lightcoral !important;
  color: white !important;
}
  </style>
  