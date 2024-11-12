<script setup>
import { ref, computed, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth'
import { Child } from '../Child';
import { ParentalLeaveDays } from '../ParentalLeaveDays';



const activeTab = ref('pattern');

const today = new Date();
const newChild = ref({ name: "", birthdate: new Date().toISOString().substring(0, 10) });
const editChildren = ref(-1);
const adjustedDays = ref(null);

const parents = ref({
   father: { isDefined: false, name: '', salary: 0 },
   mother: { isDefined: false, name: '', salary: 0 }
});
const selectedParent = ref(null);
const selectedChild = ref(null);

// Track the total remaining days for each parent across all children
const totalRemainingDays = computed(() => {
   return children.value.reduce(
      (totals, child) => {
         totals.mother.high += child.parentalLeaveDays.getHighLevelDaysLeft('mother');
         totals.mother.low += child.parentalLeaveDays.getLowLevelDaysLeft('mother');
         totals.father.high += child.parentalLeaveDays.getHighLevelDaysLeft('father');
         totals.father.low += child.parentalLeaveDays.getLowLevelDaysLeft('father');
         return totals;
      },
      { mother: { high: 0, low: 0 }, father: { high: 0, low: 0 }, double: 0 }
   );
});

// Computed property to calculate remaining days for each child
const childrenWithRemainingDays = computed(() =>
   children.value.map(child => {
      return {
         ...child,
         tuplet: child.tuplet,
         remainingDays: {
            high: child.parentalLeaveDays.getTotalHighLevelDaysLeft(),
            low: child.parentalLeaveDays.getTotalLowLevelDaysLeft(),
            double: child.parentalLeaveDays.getDoubleDaysLeft(),
            doubleDaysExpiration: child.getDoubleDaysExpiryDate().toISOString().substring(0, 10),
         },
      };
   })
);

const children = ref([]);

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
const repeatDuration = ref(8);  // Number of weeks to repeat
var todayPlusEightWeeks = new Date();
todayPlusEightWeeks.setDate(todayPlusEightWeeks.getDate() + 8 * 7);
const startDate = ref(today.toISOString().substring(0, 10));
const endDate = ref(todayPlusEightWeeks.toISOString().substring(0, 10));

const calculateEndDate = (start, weeks) => {
   const calculatedDate = new Date(start);
   calculatedDate.setDate(calculatedDate.getDate() + weeks * 7 - 1);
   return calculatedDate.toISOString().substring(0, 10);
}

function calculateRepeatDuration(start, end) {
   const timeDifference = new Date(end) - new Date(start);
   return Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 7)); // Convert ms to weeks
}

const updateDates = (field, value) => {
   if (field === 'repeatDuration') {
      repeatDuration.value = value;
      endDate.value = calculateEndDate(startDate.value, repeatDuration.value);
   } else if (field === 'endDate') {
      endDate.value = value;
      repeatDuration.value = calculateRepeatDuration(startDate.value, endDate.value);
   } else if (field === 'startDate') {
      startDate.value = value;
      repeatDuration.value = calculateRepeatDuration(startDate.value, endDate.value);
   }
}

const events = ref([]);  // Holds generated events
const ratios = [
   { id: 1, ratio: '100' },
   { id: 2, ratio: '75' },
   { id: 3, ratio: '50' },
   { id: 4, ratio: '25' },
   { id: 5, ratio: '12.5' },
   { id: 6, ratio: '0' },
];

var startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
var startOfNextYear = new Date(new Date().getFullYear() + 2, 0, 1).toISOString().slice(0, 10);

const calendarOptions = computed(() => ({
   ...FullCalendar.options,
   plugins: [dayGridPlugin, interactionPlugin, multiMonthPlugin],
   initialView: 'multiMonthCustomYear',
   views: {
      multiMonthCustomYear: {
         type: 'multiMonth',
         duration: { months: 12 },
         buttonText: 'year'
      }
   },
   headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthCustomYear,dayGridMonth,dayGridWeek'
   },
   events: events.value,
   eventClick: function (info) {
      info.jsEvent.preventDefault(); // don't let the browser navigate
      if (confirm("Do you want to remove the parental day?") == true) {
         removeEvent(info.event.id);
      };
   },
   eventDidMount: (info) => {
      // Add a class based on the event's person field
      const parent = info.event.extendedProps.parent;
      var parentClass = `parent-${parent}`;
      if (info.event.extendedProps.isLowLevel == true) {
         parentClass = parentClass.concat("-low");
      }
      info.el.classList.add(parentClass);
   }
}));

// Compute total pay for each person
const totalPay = computed(() => {
   const totals = {};
   totals.father = events.value.filter(event => event.parent === "father")
      .reduce((sum, event) => sum + event.pay, 0);
   totals.mother = events.value.filter(event => event.parent === "mother")
      .reduce((sum, event) => sum + event.pay, 0);
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

const calculateDayPay = (monthlySalary, percentage, isLowLevelDay, date) => {
   var pay = 0;
   if (isLowLevelDay === true) {
      pay = 180 * percentage / 100;
   }
   else {
      let maxSgi = 0;
      switch (date.getFullYear()) {
         case 2024:
            maxSgi = 47750;
            break;
         case 2025:
            maxSgi = 49000;
            break;
         default:
            console.log("Max SGI is not defined for this year.");
      }
      const adjustedSgi = 0.97 * 0.8 * 12 * Math.min(monthlySalary, maxSgi);
      pay = (adjustedSgi / 365) * (percentage / 100);
   }
   return pay;
};

const isDayTaken = (date, parent) => {
   return events.value.some(event =>
      event.start === date && event.parent === parent
   );
};

const isDoubleDay = (date, childId, parent) => {
   return events.value.some(event =>
      event.start === date && ((event.childId === childId) && (event.parent != parent))
   );
};


let highestEventId = 0;
const generatePattern = () => {
   const start = new Date(startDate.value);
   const end = new Date(endDate.value);
   const child = children.value.find(child => child.id === selectedChild.value.id);
   const parent = Object.keys(parents.value).find(key => parents.value[key].name === selectedParent.value.name);
   // Validate if there are enough days to create pattern
   let lowLevelDays = 0;
   let highLevelDays = 0;
   let doubleDays = 0;
   let validationFailed = false;
   for (let currentDate = new Date(start.getTime()); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayName = weekDays[(currentDate.getDay() + 6) % 7]; // Get day, but 0 for Monday
      const percentage = pattern.value[dayName].percentage;
      if (percentage > 0) {
         if (pattern.value[dayName].isLowLevel) {
            lowLevelDays = lowLevelDays + percentage / 100;
         } else {
            highLevelDays = highLevelDays + percentage / 100;
         }
         const currentDateString = currentDate.toISOString().split('T')[0]
         if (isDayTaken(currentDateString, parent)) {
            alert(`Validation failed: Parent already has a leave scheduled on ${currentDateString}. Please review the dates and try again.`);
            return;
         }
         if (isDoubleDay(currentDateString, child.id)) {
            doubleDays++;
            if (child.getDoubleDaysExpiryDate() <= currentDate)
            {
               alert(`Validation failed: The other parent already has a leave scheduled for ${child.name} on ${currentDateString}. Double days are not allowed when the child is above 15 months. Please review the dates and try again.`);
               return;
            }
         }
      }
   }
   if (doubleDays > child.parentalLeaveDays.getDoubleDaysLeft()) {
      validationFailed = true;
      const diff = doubleDays - child.parentalLeaveDays.getDoubleDaysLeft();
      alert(`Validation failed: ${diff} additional double days are required. Please adjust the schedule and try again.`);
   }
   if (lowLevelDays > child.parentalLeaveDays.getLowLevelDaysLeft(parent)) {
      validationFailed = true;
      const diff = lowLevelDays - child.parentalLeaveDays.getLowLevelDaysLeft(parent)
      alert(`Validation failed: ${diff} additional minimum-level days are required. Please adjust the schedule or transfer days and try again.`)
   }
   if (highLevelDays > child.parentalLeaveDays.getHighLevelDaysLeft(parent)) {
      const diff = highLevelDays - child.parentalLeaveDays.getHighLevelDaysLeft(parent);
      alert(`Validation failed: ${diff} additional sickness benefit level days are required. Please adjust the schedule or transfer days and try again.`)
      validationFailed = true;
   }
   if (validationFailed) {
      return;
   }


   // Create events and deduct days
   child.parentalLeaveDays.deductDoubleDays(doubleDays);
   for (let currentDate = start; currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayName = weekDays[(currentDate.getDay() + 6) % 7]; // Get day, but 0 for Monday
      const percentage = pattern.value[dayName].percentage;
      if (percentage > 0) {
         const isLowLevel = pattern.value[dayName].isLowLevel;
         const pay = calculateDayPay(selectedParent.value.salary, percentage, isLowLevel, currentDate);
         var lowLevelString = "";
         if (isLowLevel) {
            lowLevelString = " (L)"
         }

         const days = percentage / 100;
         child.parentalLeaveDays.deductDays(parent, days, isLowLevel);
         // Create the event object
         const newEvent = {
            title: `${selectedParent.value.name.charAt(0)} ${percentage}% ${pay.toFixed(0)} kr${lowLevelString}`,
            start: currentDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
            person: selectedParent.value.name,
            parent: parent,
            percentage: percentage,
            isLowLevel: isLowLevel,
            pay: pay,
            childId: child.id,
            id: highestEventId,
         };
         highestEventId++;
         events.value.push(newEvent);
      }
   }
   saveDays();
}

const removeEvent = (id) => {
   const event = events.value.find(e => e.id == id);
   if (event) {
      const { parent, percentage, isLowLevel, childId, start } = event;
      const child = children.value.find(child => child.id === childId);
      const days = percentage / 100;
      child.parentalLeaveDays.addDays(parent, days, isLowLevel);
      if (isDoubleDay(start, childId, parent)) {
         child.parentalLeaveDays.addDoubleDay();
      }
      events.value = events.value.filter(e => e.id != id);
   }
   saveDays();
};

const saveDays = () => {
   saveEvents();
   saveChildren();
};

const saveEvents = () => {
   localStorage.setItem('savedEvents', JSON.stringify(events.value));
};

// Load events from Local Storage
const loadCalendar = () => {
   const savedEvents = localStorage.getItem('savedEvents');
   if (savedEvents) {
      events.value = JSON.parse(savedEvents);
   };
};

const saveChildren = () => {
   localStorage.setItem('savedChildren', JSON.stringify(children.value));
}

const saveParents = () => {
   localStorage.setItem('savedParents', JSON.stringify(parents.value));
}

const loadChildren = () => {
   const savedChildren = localStorage.getItem('savedChildren');
   if (savedChildren) {
      JSON.parse(savedChildren).forEach(childData => {
         const parentalLeaveDays = new ParentalLeaveDays(childData.tuplet, childData.parentalLeaveDays);
         let child = new Child(childData.name, childData.birthdate, childData.id, childData.tuplet, parentalLeaveDays);
         children.value.push(child);
      });
   }
}

const loadParents = () => {
   const savedParents = localStorage.getItem('savedParents');
   if (savedParents) {
      parents.value = JSON.parse(savedParents);
   }
}

// Clear events from Local Storage and events ref
const clearCalendar = () => {
   if (confirm("Warning: This will clear all patterns for all parents. Do you want to continue?")) {
      while (events.value.length) {
         const id = events.value[events.value.length - 1].id;
         removeEvent(id);
      }
   }
}

const addChild = () => {
   let tuplets = false;
   children.value.forEach(child => {
      // This logic will only work as long as all tuplets are the same child object.
      if (child.birthdate == newChild.value.birthdate) {
         child.tupletify(newChild.value.name);
         tuplets = true;
      }
   });
   if (!tuplets) {
      let highestId = -1;
      children.value.forEach(child => {
         if (child.id > highestId) {
            highestId = child.id;
         }
      });
      // Add new child
      const parentalLeaveDays = new ParentalLeaveDays(1);
      children.value.push(new Child(newChild.value.name, newChild.value.birthdate, highestId + 1, 1, parentalLeaveDays));
   }
   if (!selectedChild.value) {
      selectedChild.value = children.value[0];
   }
   saveChildren();
}

const removeChild = (id) => {
   const childIndex = children.value.findIndex(child => child.id == id);
   if (childIndex > -1) {
      children.value.splice(childIndex, 1);
   }
   editChildren.value = -1;
   if (children.value.length > 0) {
      selectedChild.value = children.value[0]
   }
   saveChildren();
}

const editChild = (id) => {
   const child = children.value.find(child => child.id === id)
   adjustedDays.value = child.parentalLeaveDays.getAllDays();
   editChildren.value = id;
}

const updateChild = (id) => {
   const child = children.value.find(child => child.id === id)
   child.parentalLeaveDays.setAllDays(adjustedDays.value);
   editChildren.value = - 1
   saveChildren();
}

const addParent = (parent) => {
   parents.value[parent].isDefined = true;
   selectedParent.value = parents.value[parent];
   saveParents();
}

// Load events automatically when the component is mounted
onMounted(() => {
   loadParents();
   loadChildren();
   loadCalendar();
   if (parents.value.mother.isDefined) {
      selectedParent.value = parents.value.mother;
   } else if (parents.value.father.isDefined) {
      selectedParent.value = parents.value.father;
   } else {
      activeTab.value = 'parents'
   }
   if (children.value.length > 0) {
      selectedChild.value = children.value[0];
   }
});
</script>

<template>
   <div class="main-container">
      <div class="left-section">
         <div class="calendar">
            <FullCalendar :options="calendarOptions" />
         </div>
         <div class="tabs">
            <button @click="activeTab = 'pattern'">Pattern Settings</button>
            <button @click="activeTab = 'child'">Children</button>
            <button @click="activeTab = 'parents'">Parents</button>
         </div>

         <!-- Generate pattern tab -->
         <div v-if="activeTab === 'pattern'" class="settings-form">
            <form v-if="children.length > 0 && (parents.mother.isDefined || parents.father.isDefined)" @submit.prevent>
               <div>
                  <button @click="clearCalendar">Clear all patterns</button>
               </div>
               <!-- Person Selector -->
               <label for="person">Parent:</label>
               <select v-model="selectedParent">
                  <option v-if="parents.mother.isDefined" :value="parents.mother">{{ parents.mother.name }}</option>
                  <option v-if="parents.father.isDefined" :value="parents.father">{{ parents.father.name }}</option>
               </select>
               <div v-if="children.length > 1">
                  <label for="child">Child:</label>
                  <select v-model="selectedChild">
                     <option v-for="child in children" :value="child">{{ child.name }}</option>
                  </select>
               </div>
               <div v-else>
                  <label for="child">Child:</label>
                  {{ selectedChild.name }}
               </div>
               <h3>Weekly Pattern</h3>
               <table class="pattern-table">
                  <tr v-for="day in weekDays" :key="day">
                     <td>{{ day }}</td>
                     <td class="pattern-table-right">
                        <select v-model="pattern[day].percentage">
                           <option v-for="ratio in ratios" :key="ratio.id" :value="ratio.ratio">{{ ratio.ratio }}%
                           </option>
                        </select>
                        <div class="low-level-checkbox">
                           <input type="checkbox" v-model="pattern[day].isLowLevel" />
                           <label>Low-Level Day</label>
                        </div>
                     </td>
                  </tr>
                  <!-- Repeat Duration -->
                  <tr>
                     <td>
                        <label for="startDate">Start date</label>
                     </td>
                     <td>
                        <input type="date" :value="startDate" @input="updateDates('startDate', $event.target.value)" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <label for="endDate">End date</label>
                     </td>
                     <td>
                        <input type="date" :value="endDate" @input="updateDates('endDate', $event.target.value)" />
                        <span>
                           =
                           <input type="number" :value="repeatDuration"
                              @input="updateDates('repeatDuration', $event.target.value)" placeholder="Number of weeks"
                              min=0 style="width: 2.5em;" />
                           <label for="repeatDuration">weeks</label>
                        </span>
                     </td>
                  </tr>
               </table>
               <button type="submit" @click="generatePattern">Generate Pattern</button>
            </form>
            <div v-else>
               <p>Pattern generation not possible:</p>
               <p v-if="children.length == 0">No child added.</p>
               <p v-if="!parents.father.isDefined && !parents.mother.isDefined">No parent added.</p>
            </div>
         </div>

         <!-- Children tab -->
         <div v-if="activeTab === 'child'" class="settings-form">
            <h2>Children</h2>
            <div v-if=children>
               <div v-for="child in childrenWithRemainingDays" :key="child.name">
                  <h4>{{ child.birthdate }} : {{ child.name }}</h4>
                  <p>Sickness Benefit Level Days Left:</p>
                  <div v-if="editChildren == child.id">
                     <label>Father:</label>
                     <input type="number" v-model="adjustedDays.father.high" />
                     <label>Mother:</label>
                     <input type="number" v-model="adjustedDays.mother.high" />
                  </div>
                  <p v-else>{{ child.remainingDays.high }}</p>
                  <p>Low Level Days Left:</p>
                  <div v-if="editChildren == child.id">
                     <label>Father:</label>
                     <input type="number" v-model="adjustedDays.father.low" />
                     <label>Mother:</label>
                     <input type="number" v-model="adjustedDays.mother.low" />

                  </div>
                  <p v-else>{{ child.remainingDays.low }}</p>
                  <div v-if="child.tuplet == 1">
                     <p> Double Days Left:</p>
                     <div v-if="editChildren == child.id">
                        <input type="number" v-model="adjustedDays.double" />
                     </div>
                     <p v-else>{{ child.remainingDays.double }} (valid to {{ child.remainingDays.doubleDaysExpiration
                        }})</p>
                  </div>
                  <div>
                     <button v-if="editChildren == child.id" @click="updateChild(child.id)">OK</button>
                     <button v-if="editChildren == child.id" @click="removeChild(child.id)">Remove child</button>
                     <button v-else @click="editChild(child.id)">Edit</button>
                  </div>
               </div>
            </div>
            <h3>Add child</h3>
            <label for="childName">Child's Name:</label>
            <input type="text" v-model="newChild.name" placeholder="Enter child's name" />

            <label for="birthdate">Birthdate:</label>
            <input type="date" v-model="newChild.birthdate" />

            <button @click="addChild">Add Child</button>
         </div>

         <!-- Parents tab -->
         <div v-if="activeTab === 'parents'" class="settings-form">
            <h2>Parents</h2>
            <div v-if="parents.father.isDefined">
               <h4>Father: {{ parents.father.name }}</h4>
               <p>Monthly Salary: {{ parents.father.salary }}</p>
               <button @click="parents.father.isDefined = false">Edit</button>
            </div>
            <div v-else>
               <label for="parentName">Father's Name:</label>
               <input type="text" v-model="parents.father.name" placeholder="Enter fathers's name" />

               <label for="salary">Monthly&nbspSalary:</label>
               <input type="number" min=0 v-model="parents.father.salary"
                  placeholder="Enter fathers's monthly salary" />

               <button @click="addParent('father')">Add Father</button>
            </div>

            <div v-show="parents.mother.isDefined">
               <h4>Mother: {{ parents.mother.name }}</h4>
               <p>Monthly Salary: {{ parents.mother.salary }}</p>
               <button @click="parents.mother.isDefined = false">Edit</button>
            </div>
            <div v-show="!parents.mother.isDefined">
               <label for="parentName">Mother's Name:</label>
               <input type="text" v-model="parents.mother.name" placeholder="Enter mothers's name" />

               <label for="salary">Monthly&nbspSalary:</label>
               <input type="number" min=0 v-model="parents.mother.salary"
                  placeholder="Enter mothers's monthly salary" />

               <button @click="addParent('mother')">Add Mother</button>
            </div>

         </div>
      </div>

      <!-- Information Box -->
      <div class="summary-box">
         <h3>Total pay</h3>
         <p v-if="parents.father.isDefined">
            {{ parents.father.name }}: {{ totalPay.father.toFixed(0) }}
         </p>
         <p v-if="parents.mother.isDefined">
            {{ parents.mother.name }}: {{ totalPay.mother.toFixed(0) }}
         </p>
         <h3>Days left</h3>
         <p v-if="parents.father.isDefined">
            {{ parents.father.name }}: H {{ totalRemainingDays.father.high }} L {{ totalRemainingDays.father.low }}
         </p>
         <p v-if="parents.mother.isDefined">
            {{ parents.mother.name }}: H {{ totalRemainingDays.mother.high }} L {{ totalRemainingDays.mother.low }}
         </p>
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

.pattern-table-right {
   display: flex;
   gap: 20px;
}

.low-level-checkbox {
   display: flex;
   gap: 5px;
   /* Space between checkbox and label */
}

.parent-father {
   background-color: #00BFFF !important;
   border-color: #00BFFF !important;
   color: white !important;
}

.parent-father-low {
   background: repeating-linear-gradient(45deg,
         #00BFFF,
         #00BFFF 8px,
         #22DFFF 8px,
         #22DFFF 16px);
   border-color: #00BFFF !important;
   color: white !important;
}

.parent-mother {
   background-color: lightcoral !important;
   border-color: lightcoral !important;
   color: white !important;
}

.parent-mother-low {
   background: repeating-linear-gradient(45deg,
         lightcoral,
         lightcoral 8px,
         #F4A4A4 8px,
         #F4A4A4 16px);
   border-color: lightcoral !important;
   color: white !important;
}

.fc-event,
.event-title {
   padding: 0 1px;
   white-space: normal;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
   -webkit-appearance: none;
   margin: 0;
}
</style>