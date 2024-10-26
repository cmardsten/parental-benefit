  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';


      const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      var pattern = ref({
        Monday: { percentage: "100", isLowLevel: false },
        Tuesday: { percentage: "100", isLowLevel: false },
        Wednesday: { percentage: "100", isLowLevel: false },
        Thursday: { percentage: "100", isLowLevel: false },
        Friday: { percentage: "100", isLowLevel: false },
        Saturday: { percentage: "100", isLowLevel: false },
        Sunday: { percentage: "100", isLowLevel: false },
      });
      const repeatDuration = ref(1);  // Number of weeks to repeat
      const events = ref([{ title: '100% 871 kr', date: '2024-10-15', person: 'Richard', isLowLevel: true}]);  // Holds generated events
      const ratios = [
        { id: 1, ratio: '100' },
        { id: 2, ratio: '75' },
        { id: 3, ratio: '50' },
        { id: 4, ratio: '25' },
        { id: 5, ratio: '12.5' },
        { id: 6, ratio: '0' },
    ];
      const persons = [
        { id: 1, name: 'Richard', salary: 39000 },
        { id: 2, name: 'Linnea', salary: 36000 },
      ];
      const selectedPerson = ref( persons[0] );
      
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
            eventDidMount: (info) => {
                // Add a class based on the event's person field
                var personClass = `person-${info.event.extendedProps.person.toLowerCase()}`;
                if (info.event.extendedProps.isLowLevel == true)
                {
                    personClass = personClass.concat("-low");
                }
                info.el.classList.add(personClass);
            }
        }));

    // Compute total pay for each person
    const totalPay = computed(() => {
        const totals = {};
        persons.forEach(person => {
            totals[person.name] = events.value
            .filter(event => event.person === person.name)
            .reduce((sum, event) => sum + event.pay, 0);
        });
        return totals;
    });

    const onDatesSet = (dateInfo) => {
        // Logic for handling date changes
        console.log('Current date range:', dateInfo.start, dateInfo.end);
    };

    const renderYearView = () => {
        // Logic to render the year view (can be extended)
        console.log('Year view triggered');
    };

    const calculateDayPay = (monthlySalary, percentage, isLowLevelDay) => {
        var pay = 0;
        if (isLowLevelDay === true)
        {
            pay = 180 * percentage / 100;
        }
        else
        {
            const adjustedSgi = 0.97 * 0.8 * 12 * monthlySalary;
            pay = (adjustedSgi / 365) * (percentage / 100);
        }
        return pay;
    };

    const generatePattern = () => {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Start of the week (Monday)
      
      // Loop over the number of weeks based on repeatDuration
      for (let week = 0; week < repeatDuration.value; week++) {
        weekDays.forEach((day, index) => {
          const percentage = pattern.value[day].percentage;
          if (percentage > 0)
          {
            const eventDate = new Date(startOfWeek);
            eventDate.setDate(eventDate.getDate() + index + week * 7); // Calculate the correct date for each day
            const isLowLevel = pattern.value[day].isLowLevel;
            const pay = calculateDayPay(selectedPerson.value.salary, percentage, isLowLevel);
            var lowLevelString = "";
            if (isLowLevel)
            {
                lowLevelString = " (L)"
            }
            // Create the event object
            const newEvent = {
                title: `${selectedPerson.value.name.charAt(0)} ${percentage}% ${pay.toFixed(0)} kr${lowLevelString}`,
                start: eventDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
                person: selectedPerson.value.name,
                percentage: percentage,
                isLowLevel: isLowLevel,
                pay: pay,
            };
            events.value.push(newEvent);
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
    <button @click="saveCalendar">Save Calendar</button>
    <button @click="loadCalendar">Load Calendar</button>
    <button @click="clearCalendar">Clear Calendar</button>
    <div class="main-container">
        <div class="left-section">
            <div class="calendar">
            <FullCalendar :options="calendarOptions" />
            </div>
            <div class="settings-form">
                <form @submit.prevent="generatePattern">
                    <!-- Person Selector -->
                    <label for="person">Select Person:</label>
                    <select v-model="selectedPerson">
                    <option v-for="person in persons" :key="person.id" :value="person">{{ person.name }}</option>
                    </select>
                    <label>Monthly salary:</label>
                    <input type="number" v-model="selectedPerson.salary"/>
                    <h3>Weekly Pattern</h3>
                    <div v-for="day in weekDays" :key="day">
                    <label :for="day">{{ day }}</label>
                    <select v-model="pattern[day].percentage">
                        <option v-for="ratio in ratios" :key="ratio.id" :value="ratio.ratio">{{ ratio.ratio }}</option>
                    </select>
                    <label>
                        <input type="checkbox" v-model="pattern[day].isLowLevel" />
                        Low-level Day
                    </label>
                    </div>
                    <!-- Repeat Duration -->
                    <label for="repeatDuration">Repeat for (weeks):</label>
                    <input type="number" v-model="repeatDuration" min="1" placeholder="Number of weeks" />
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
        </div>

        <!-- Information Box -->
        <div class="summary-box">
            <h3>Total Pay</h3>
            <ul>
                <li v-for="person in persons" :key="person.id">
                {{ person.name }}: {{ totalPay[person.name].toFixed(0) }} kr
                </li>
            </ul>
        </div>
    </div>
</template>
  
<style>

.main-container {
  display: flex;
  gap: 20px;
}

.left-section {
  display: flex;
  flex-direction: column;
  flex: 3;
  gap: 20px;
}

.calendar {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}

.settings-form {
  border: 1px solid #ddd;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.summary-box {
  align-self: flex-start;
  border: 1px solid #ddd;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.person-richard {
  background-color: #00BFFF !important;
  border-color: #00BFFF !important;
  color: white !important;
}

.person-richard-low {
  background: repeating-linear-gradient(
    45deg,
    #00BFFF,
    #00BFFF 8px,
    #22DFFF 8px,
    #22DFFF 16px
    );
  border-color: #00BFFF !important;
  color: white !important;
}

.person-linnea {
  background-color: lightcoral !important;
  border-color: lightcoral !important;
  color: white !important;
}

.person-linnea-low {
  background: repeating-linear-gradient(
    45deg,
    lightcoral,
    lightcoral 8px,
    #F4A4A4 8px,
    #F4A4A4 16px
    );
  border-color: lightcoral !important;
  color: white !important;
}


</style>
  