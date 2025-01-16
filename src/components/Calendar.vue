<script setup>
import { ref, computed, onMounted } from 'vue';
import { Child } from '../Child';
import { ParentalLeaveDays } from '../ParentalLeaveDays';
import DayPopup from './DayPopup.vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const activeTab = ref('pattern');

const today = new Date();
const newChild = ref({ name: "", birthdate: new Date().toISOString().substring(0, 10) });
const newParent = ref({ name: "", salary: 0 });
const editChildren = ref(-1);
const editParents = ref(-1);
const adjustedDays = ref(null);
const adjustedDoubleDays = ref(null);

const parents = ref([]);
const selectedParent = ref(null);
const children = ref([]);
const selectedChild = ref(null);

// Track the total remaining days for all parents across all children
const totalRemainingDays = computed(() => {
   let totals = {};
   let totalSum = { high: 0, low: 0 };
   parents.value.forEach((parent) => {
      totals[parent.id] = { high: 0, low: 0 };
   });

   children.value.forEach((child) => {
      parents.value.forEach((parent) => {
         const parentId = parent.id;
         totals[parentId].high += child.parentalLeaveDays.getHighLevelDaysLeft(parentId);
         totals[parentId].low += child.parentalLeaveDays.getLowLevelDaysLeft(parentId);
         totalSum.high += child.parentalLeaveDays.getHighLevelDaysLeft(parentId);
         totalSum.low += child.parentalLeaveDays.getLowLevelDaysLeft(parentId);
      });
   });
   let result = {
      parents: totals,
      sum: totalSum
   };
   return result;
});

// Computed property to calculate pay per month per parent
const monthPay = computed(() => {
  const parentIds = parents.value.map(parent => parent.id);
  const pay = Array.from({ length: 12 }, () => {
    const monthData = {};
    parentIds.forEach(parentId => {
      monthData[parentId] = 0;
    });
    return monthData;
  });

  events.value.forEach(event => {
    const eventDate = new Date(event.start);
    if (eventDate.getFullYear() == selectedYear.value)
    {
      const monthIndex = eventDate.getMonth(eventDate);
      pay[monthIndex][event.parentId] += event.pay;
    }
  });

  return pay;
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

// Compute total pay for each person
const totalPay = computed(() => {
   const totals = {};
   totals.father = events.value.filter(event => event.parent === "father")
      .reduce((sum, event) => sum + event.pay, 0);
   totals.mother = events.value.filter(event => event.parent === "mother")
      .reduce((sum, event) => sum + event.pay, 0);
   return totals;
});

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

const isDayTaken = (date, parentId) => {
   return events.value.some(event =>
      event.start === date && event.parentId === parentId
   );
};

const isDoubleDay = (date, childId, parentId) => {
   return events.value.some(event =>
      event.start === date && ((event.childId === childId) && (event.parentId != parentId))
   );
};


let highestEventId = 0;
const generatePattern = () => {
   const start = new Date(startDate.value);
   const end = new Date(endDate.value);
   const child = children.value.find(child => child.id === selectedChild.value.id);
   const parent = parents.value.find(parent => parent.id === selectedParent.value.id);
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
         if (isDayTaken(currentDateString, parent.id)) {
            alert(t('validationFailedDayAlreadyScheduled', { currentDateString: currentDateString }));
            return;
         }
         if (isDoubleDay(currentDateString, child.id, parent.id)) {
            doubleDays++;
            if (child.getDoubleDaysExpiryDate() <= currentDate) {
               alert(t('validationFailedDoubleDayAfter15Months', { childname: child.name, currentDateString: currentDateString }));
               return;
            }
         }
      }
   }
   if (doubleDays > child.parentalLeaveDays.getDoubleDaysLeft()) {
      validationFailed = true;
      const diff = doubleDays - child.parentalLeaveDays.getDoubleDaysLeft();
      alert(t('validationFailedOutOfDoubleDays', { missingDays: diff }));
   }
   if (lowLevelDays > child.parentalLeaveDays.getLowLevelDaysLeft(parent.id)) {
      validationFailed = true;
      const diff = lowLevelDays - child.parentalLeaveDays.getLowLevelDaysLeft(parent.id)
      alert(t('validationFailedOutOfMinimumLevelDays', { missingDays: diff }));
   }
   if (highLevelDays > child.parentalLeaveDays.getHighLevelDaysLeft(parent.id)) {
      const diff = highLevelDays - child.parentalLeaveDays.getHighLevelDaysLeft(parent.id);
      alert(t('validationFailedOutOfSicknessBenefitLevelDays', { missingDays: diff }));
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
         const pay = calculateDayPay(parent.salary, percentage, isLowLevel, currentDate);
         var lowLevelString = "";
         if (isLowLevel) {
            lowLevelString = " (L)"
         }

         const days = percentage / 100;
         child.parentalLeaveDays.deductDays(parent.id, days, isLowLevel);
         // Create the event object
         const newEvent = {
            title: `${parent.name.charAt(0)} ${percentage}% ${pay.toFixed(0)} kr${lowLevelString}`,
            start: currentDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
            percentage: percentage,
            isLowLevel: isLowLevel,
            pay: pay,
            childId: child.id,
            parentId: parent.id,
            person: parent.name,
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
      const { parentId, percentage, isLowLevel, childId, start } = event;
      const child = children.value.find(child => child.id === childId);
      const days = percentage / 100;
      child.parentalLeaveDays.addDays(parentId, days, isLowLevel);
      if (isDoubleDay(start, childId, parentId)) {
         child.parentalLeaveDays.addDoubleDay();
      }
      events.value = events.value.filter(e => e.id != id);
   }
   saveDays();
};

const getParentsString = (parentIds) => {
   const matchingParents = parents.value.filter(parent => parentIds.includes(parent.id));
   const names = matchingParents.map(parent => parent.name);
   return names.join(t(' and '));
}

const removeFormData = ref({
   startDate: today.toISOString().split('T')[0],
   endDate: today.toISOString().split('T')[0],
   selectedParents: [],
});
const removeEventsInRange = () => {
   if (removeFormData.value.selectedParents.length == 0) {
      alert(t('noParentSelected'));
      return;
   }
   const start = new Date(removeFormData.value.startDate);
   const end = new Date(removeFormData.value.endDate);
   const eventsToRemove = events.value.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= start && eventDate <= end && removeFormData.value.selectedParents.includes(event.parentId);
   })
   const idsToRemove = eventsToRemove.map(event => event.id);
   for (let ii = events.value.length - 1; ii >= 0; ii--) {
      const id = events.value[ii].id;
      if (idsToRemove.includes(id)) {
         removeEvent(id);
      }
   }

   alert(t('eventsBetweenStartAndEndHasBeenRemovedForParents', { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], parents: getParentsString(removeFormData.value.selectedParents) }));
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
         let parentalLeaveDays = new ParentalLeaveDays(childData.parentalLeaveDays.parentIds);
         parentalLeaveDays.initializeFromObject(childData.parentalLeaveDays)
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

const saveLanguage = () => {
   localStorage.setItem('locale', locale.value);
}

// Clear events from Local Storage and events ref
const clearCalendar = () => {
   if (confirm(t('warningClearAllPatternsForParent', { parentName: selectedParent.value.name }))) {
      for (let ii = events.value.length - 1; ii >= 0; ii--) {
         if (events.value[ii].parentId === selectedParent.value.id) {
            const id = events.value[ii].id;
            removeEvent(id);
         }
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
      const parentIds = parents.value.map(parent => parent.id);
      const parentalLeaveDays = new ParentalLeaveDays(parentIds);
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
   adjustedDoubleDays.value = child.parentalLeaveDays.getDoubleDaysLeft();
   editChildren.value = id;
}

const updateChild = (id) => {
   const child = children.value.find(child => child.id === id)
   child.parentalLeaveDays.setAllDays(adjustedDays.value);
   child.parentalLeaveDays.setDoubleDaysLeft(adjustedDoubleDays.value);
   editChildren.value = - 1
   saveChildren();
}

const addParent = () => {
   let highestId = -1;
   parents.value.forEach(parent => {
      if (parent.id > highestId) {
         highestId = parent.id;
      }
   });
   parents.value.push({ ...newParent.value, id: highestId + 1 });
   newParent.value = { name: '', salary: 0 }; // Reset new parent
   selectedParent.value = parents.value[0];
   saveParents();
}

const updateParent = () => {
   editParents.value = - 1;
   saveParents();
}

const getParentNameFromId = (id) => {
   const parent = parents.value.find(p => p.id == id);
   return parent.name
}

const removeParent = (id) => {
   const parentIndex = parents.value.findIndex(parent => parent.id == id);
   if (parentIndex > -1) {
      parents.value.splice(parentIndex, 1);
   }
   editParents.value = -1;
   if (parents.value.length > 0) {
      selectedParent.value = parents.value[0]
   }
   saveParents();
}

const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni",
   "Juli", "Augusti", "September", "Oktober", "November", "December"
];

const selectedYear = ref(new Date().getFullYear());
const yearData = computed(() => {
   const year = selectedYear.value;
   const yearResult = {};

   for (let month = 0; month < 12; month++) {
      const monthData = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
         const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
         const weekDayIndex = new Date(year, month, day).getDay();
         monthData.push({
            date,
            dayNumber: day,
            isWeekend: weekDayIndex === 0 || weekDayIndex === 6,
            events: parents.value.reduce((acc, parent) => {
               acc[parent.id] = events.value.filter(e => e.parentId === parent.id && e.start == date);
               return acc;
            }, {}),
         });
      }

      yearResult[month] = monthData;
   }

   return yearResult;
});

const getEventClass = (parentId, isLowLevel) => {
   var eventClass = '';
   if (parentId == 0) {
      if (isLowLevel) {
         eventClass = 'event-parent-0-low';
      }
      else {
         eventClass = 'event-parent-0';
      }
   }
   else {
      if (isLowLevel) {
         eventClass = 'event-parent-1-low'
      }
      else {
         eventClass = 'event-parent-1';
      }
   }
   return eventClass;
}

const popupState = ref({
   visible: false,
   date: null,
   name: null,
   percentage: null,
   isLowLevel: null,
   pay: null,
   x: 0,
   y: 0,
   disableHide: false,
   currentElement: null,
   oldStyle: null
})

const populatePopupState = (date, name, percentage, isLowLevel, pay, event) =>
{
   popupState.value.visible = true;
   popupState.value.date = date;
   popupState.value.name = name;
   popupState.value.percentage = percentage;
   popupState.value.isLowLevel = isLowLevel;
   popupState.value.pay = pay;
   popupState.value.x = event.clientX;
   popupState.value.y = event.clientY;
   popupState.value.disableHide = false;
   popupState.value.currentElement = event.target;
   popupState.value.oldStyle = event.target.getAttribute("style");
}

const showPopup = (date, name, percentage, isLowLevel, pay, event) => {
   if (!popupState.value.disableHide)
   {
      populatePopupState(date, name, percentage, isLowLevel, pay, event);
   }
};

const onDayClick = (date, name, percentage, isLowLevel, pay, event) => {
   if (!popupState.value.disableHide)
   {
      populatePopupState(date, name, percentage, isLowLevel, pay, event);
      popupState.value.currentElement.setAttribute("style", "border: solid 2px");
      popupState.value.disableHide = true;
   }
   else
   {
      popupState.value.disableHide = false;
      hidePopup();
   }
}

const onDayMouseLeave = () => {
   if (!popupState.value.disableHide)
   {
      hidePopup();
   }
}

const hidePopup = () => {
   popupState.value.currentElement.setAttribute("style", popupState.value.oldStyle);
   popupState.value.disableHide = false;
   popupState.value.visible = false;
};

// Load events automatically when the component is mounted
onMounted(() => {
   loadParents();
   loadChildren();
   loadCalendar();
   if (parents.value.length > 0) {
      selectedParent.value = parents.value[0];
   }
   if (children.value.length > 0) {
      selectedChild.value = children.value[0];
   }
   console.log(parents.value);
   document.addEventListener('click', hidePopup);
});
</script>
<template>
   <div class="main-container">
      <div class="left-section">
         <div>
            <h2>
               <i tabindex="0" class="arrow left" @click="selectedYear--" @keyup.enter="selectedYear--"></i>
                  {{ selectedYear }}
               <i class="arrow right" tabindex="0" @click="selectedYear++" @keyup.enter="selectedYear++"></i>
            </h2>
            <div class="calendar-grid">
               <div v-for="(month, index) in yearData" :key="index">
                  <p>{{ monthNames[index] }}</p>
                  <div class="month-slot">
                     <div v-for="day in month" :key="day.date" :class="{ today: day.isToday, weekend: day.isWeekend }" class="day-slot">
                        {{ day.dayNumber }}
                     </div>
                  </div>
                  <div v-for="parent in parents">
                     <div class="month-slot">
                        <div v-for="day in month" :key="day.date" class="day-slot-parent">
                           <div v-if="day.events[parent.id].length > 0"
                              :class="getEventClass(parent.id, day.events[parent.id][0]?.isLowLevel)"
                              @mouseenter="(event) => showPopup(day.date, 
                                                                parent.name,
                                                                day.events[parent.id][0]?.percentage,
                                                                day.events[parent.id][0]?.isLowLevel,
                                                                day.events[parent.id][0]?.pay,
                                                                event)"
                              @click.stop="(event) => onDayClick(day.date, 
                                                                 parent.name,
                                                                 day.events[parent.id][0]?.percentage,
                                                                 day.events[parent.id][0]?.isLowLevel,
                                                                 day.events[parent.id][0]?.pay,
                                                                 event)"
                              @mouseleave="onDayMouseLeave">
                              {{ day.events[parent.id][0]?.percentage }}
                           </div>
                        </div>
                        <div class="parent-sum">
                        {{ monthPay[index][parent.id].toFixed(0) }} kr
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div class="tabs">
            <button @click="activeTab = 'pattern'">{{ $t('scheduleLeave') }}</button>
            <button @click="activeTab = 'removeLeave'">{{ $t('removeLeave') }}</button>
            <button @click="activeTab = 'child'">{{ $t('children') }}</button>
            <button @click="activeTab = 'parents'">{{ $t('parents') }}</button>
            <label for="language">{{ $t('language') }}</label>
            <select v-model="$i18n.locale" @change="saveLanguage">
               <option value='sv'>Svenska</option>
               <option value='en'>English</option>
            </select>
         </div>

         <!-- Generate pattern tab -->
         <div v-if="activeTab === 'pattern'" class="settings-form">
            <form v-if="children.length > 0 && parents.length > 0" @submit.prevent>
               <div>
               </div>
               <!-- Person Selector -->
               <label for="person">{{ $t('parent') }}:</label>
               <select v-model="selectedParent">
                  <option v-for="parent in parents" :value="parent">{{ parent.name }}</option>
               </select>
               <button @click="clearCalendar">{{ $t('clearAllScheduledDays') }}</button>
               <div v-if="children.length > 1">
                  <label for="child">{{ $t('child') }}:</label>
                  <select v-model="selectedChild">
                     <option v-for="child in children" :value="child">{{ child.name }}</option>
                  </select>
               </div>
               <div v-else>
                  <label for="child">{{ $t('child') }}:</label>
                  {{ selectedChild.name }}
               </div>
               <h3>{{ $t('weeklyPattern') }}</h3>
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
                           <label>{{ $t('minimumLevel') }}</label>
                        </div>
                     </td>
                  </tr>
                  <!-- Repeat Duration -->
                  <tr>
                     <td>
                        <label for="startDate">{{ $t('startDate') }}</label>
                     </td>
                     <td>
                        <input type="date" :value="startDate" @input="updateDates('startDate', $event.target.value)" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <label for="endDate">{{ $t('endDate') }}</label>
                     </td>
                     <td>
                        <input type="date" :value="endDate" @input="updateDates('endDate', $event.target.value)" />
                        <span>
                           =
                           <input type="number" :value="repeatDuration"
                              @input="updateDates('repeatDuration', $event.target.value)" min=0 style="width: 2.5em;" />
                           <label for="repeatDuration">{{ $t('weeks') }}</label>
                        </span>
                     </td>
                  </tr>
               </table>
               <button type="submit" @click="generatePattern">{{ $t('generatePattern') }}</button>
            </form>
            <div v-else>
               <p>{{ $t('patternGenerationNotPossible') }}:</p>
               <p v-if="parents.length == 0">{{ $t('noParentAdded') }}.</p>
               <p v-if="children.length == 0">{{ $t('noChildAdded') }}.</p>
            </div>
         </div>
         <!-- Remove leave tab -->
         <div v-if="activeTab === 'removeLeave'" class="settings-form">
            <h2>{{ $t('removeLeave') }}</h2>
            <form @submit.prevent="removeEventsInRange">
               <tr>
                  <td>
                     <div v-for="parent in parents" :key="parent.id">
                        <input :value="parent.id" type="checkbox" v-model="removeFormData.selectedParents" />
                        <label>{{ parent.name }}</label>
                     </div>
                  </td>
               </tr>
               <tr>
                  <td>
                     <label for="startDate">{{ $t('startDate') }}</label>
                  </td>
                  <td>
                     <input type="date" v-model="removeFormData.startDate" />
                  </td>
               </tr>
               <tr>
                  <td>
                     <label for="endDate">{{ $t('endDate') }}</label>
                  </td>
                  <td>
                     <input type="date" v-model="removeFormData.endDate" />
                  </td>
               </tr>
               <button type="submit">{{ $t('remove') }}</button>
            </form>
         </div>

         <!-- Children tab -->
         <div v-if="activeTab === 'child'" class="settings-form">
            <h2>{{ $t('children') }}</h2>
            <div v-if=children>
               <div v-for="child in childrenWithRemainingDays" :key="child.name">
                  <h4>{{ child.birthdate }} : {{ child.name }}</h4>
                  <p>{{ $t('daysLeftOn') }}:</p>
                  <div v-if="editChildren == child.id">
                     <p>{{ $t('sicknessBenefitLevel') }}:</p>
                     <div v-for="parent in adjustedDays" :key="parent.parentId">
                        <label>{{ getParentNameFromId(parent.parentId) }}</label>
                        <input type="number" v-model="parent.high" />
                     </div>
                  </div>
                  <p v-else>{{ $t('sicknessBenefitLevel') }}: {{ child.remainingDays.high }}</p>
                  <div v-if="editChildren == child.id">
                     <p>{{ $t('minimumLevel') }}:</p>
                     <div v-for="parent in adjustedDays" :key="parent.parentId">
                        <label>{{ getParentNameFromId(parent.parentId) }}</label>
                        <input type="number" v-model="parent.low" />
                     </div>
                  </div>
                  <p v-else>{{ $t('minimumLevel') }}: {{ child.remainingDays.low }}</p>
                  <div v-if="child.tuplet == 1">
                     <p> {{ $t('doubleDaysLeft') }}:</p>
                     <div v-if="editChildren == child.id">
                        <input type="number" v-model="adjustedDoubleDays" />
                     </div>
                     <p v-else>{{ child.remainingDays.double }} ({{ $t('validTo') }} {{
                        child.remainingDays.doubleDaysExpiration
                     }})</p>
                  </div>
                  <div>
                     <button v-if="editChildren == child.id" @click="updateChild(child.id)">{{ $t('OK') }}</button>
                     <button v-if="editChildren == child.id" @click="removeChild(child.id)">{{ $t('removeChild')
                        }}</button>
                     <button v-else @click="editChild(child.id)">{{ $t('edit') }}</button>
                  </div>
               </div>
            </div>
            <div v-if="parents.length > 0">
               <h3>{{ $t('addChild') }}</h3>
               <label for="childName">{{ $t('name') }}:</label>
               <input type="text" v-model="newChild.name" placeholder="Enter child's name" />

               <label for="birthdate">{{ $t('birthdate') }}:</label>
               <input type="date" v-model="newChild.birthdate" />

               <button @click="addChild">{{ $t('add') }}</button>
            </div>
            <div v-else>
               <p>{{ $t('parentsHaveToBeAddedFirst') }}</p>
            </div>
         </div>

         <!-- Parents tab -->
         <div v-if="activeTab === 'parents'" class="settings-form">
            <h2>{{ $t('parents') }}</h2>
            <div v-if=parents>
               <div v-for="parent in parents" :key="parent.id">
                  <div v-if="editParents == parent.id">
                     <div>
                        <label for="parentName">{{ $t('name') }}:</label>
                        <input type="text" v-model="parent.name" placeholder="Enter parent's name" />
                     </div>
                     <div>
                        <label for="salary">{{ $t('monthlySalary') }}:</label>
                        <input type="number" v-model="parent.salary" min=0 placeholder="Enter parent's monthly salary"
                           value= />
                     </div>
                     <button @click="updateParent()">{{ $t('OK') }}</button>
                     <button @click="removeParent(parent.id)">{{ $t('remove') }}</button>
                  </div>
                  <div v-else>
                     <h4>{{ $t('parent') }}: {{ parent.name }}</h4>
                     <p>{{ $t('monthlySalary') }}: {{ parent.salary }}</p>
                     <button @click="editParents = parent.id">{{ $t('edit') }}</button>
                  </div>
               </div>
            </div>
            <h3>{{ $t('addParent') }}</h3>
            <div>
               <label for="parentName">{{ $t('name') }}:</label>
               <input type="text" v-model="newParent.name" placeholder="Enter parent's name" />
            </div>
            <div>
               <label for="salary">{{ $t('monthlySalary') }}:</label>
               <input type="number" v-model="newParent.salary" min=0 placeholder="Enter parent's monthly salary" />
            </div>
            <button @click="addParent()">{{ $t('add') }}</button>
         </div>
      </div>

      <!-- Information Box -->
      <div class="summary-box">
         <h3>{{ $t('totalPay') }}</h3>
         <p v-for="parent in parents" :key="parent.id">
            {{ parent.name }}: {{ totalPay.father.toFixed(0) }}
         </p>
         <h3>{{ $t('daysLeft') }}</h3>
         <p v-for="parent in parents" :key="parent.id">
            {{ parent.name }}: H {{ totalRemainingDays.parents[parent.id].high }} L {{
               totalRemainingDays.parents[parent.id].low }}
         </p>
         <p>
            {{ $t('total') }}: H {{ totalRemainingDays.sum.high }} L {{ totalRemainingDays.sum.low }}
         </p>
      </div>
   </div>
   <DayPopup v-if="popupState.visible"
   :date=popupState.date
   :name=popupState.name
   :lowLevel=popupState.isLowLevel
   :pay=popupState.pay
   :percentage=popupState.percentage
   :x="popupState.x"
   :y="popupState.y"
   :disableHide="popupState.disableHide"
   @click.stop
   @close="hidePopup"
   />
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

.arrow {
  border: solid gray;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 6px;
}

.arrow:hover{
  border: solid lightgray;
  border-width: 0 4px 4px 0;
  display: inline-block;
  padding: 6px;
}

.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
  margin-left: 10px;
}

.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
  margin-right: 10px;
}

.calendar {
   border: 1px solid #dddddd;
   padding: 15px;
   border-radius: 8px;
}

.settings-form {
   border: 1px solid #dddddd;
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

.parent-0 {
   background-color: #00BFFF !important;
   border-color: #00BFFF !important;
   color: white !important;
}

.parent-1 {
   background-color: lightcoral !important;
   border-color: lightcoral !important;
   color: white !important;
}

.parent-1-low {
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

@media (prefers-color-scheme: dark) {
   .summary-box {
      align-self: flex-start;
      border: 1px solid #333333;
      background-color: #222222;
   }

   .settings-form {
      border: 1px solid #333333;
      background-color: #222222;
   }

   button,
   select,
   input {
      background-color: #333333;
      color: #dddddd;
      border: 1px solid #555;
      transition: background-color 0.2s, border-color 0.2s;
   }

   button:hover,
   select:hover,
   input:hover {
      background-color: #555555;
      border-color: #777777;
   }

   button:active {
      background-color: #222;
   }
}

.calendar-grid {
   display: flex;
   flex-wrap: wrap;
   gap: 8px;
}

.month-slot {
   display: flex;
}

.day-slot {
   border: 1px solid #777;
   border-radius: 2px;
   text-align: center;
   width: 32px;
   background: #aaa;
   font-size: 14px;
   color: black;
}

.day-slot-parent {
   border: 1px solid #999;
   border-radius: 2px;
   text-align: center;
   line-height: 100%;
   padding: 0px;
   width: 32px;
   height: 20px;
   margin: 0px;
   background: #ccc;
   color: black;
}

.parent-sum {
   border: 1px solid #777;
   border-radius: 2px;
   text-align: center;
   line-height: 100%;
   padding: 0px;
   width: 64px;
   height: 20px;
   margin-left: 0px;
   background: #ccc;
   color: black;
}

.day-slot.today {
   background: #007bff;
   color: white;
   font-weight: bold;
}

.day-slot.weekend {
   background: #888;
}

.day-slot:hover {
   background: #e7f1ff;
}

.event-parent-1 {
   width: 100%;
   height: 100%;
   margin: 0px;
   padding: 0px;
   background: lightcoral;
}

.event-parent-1-low {
   width: 100%;
   height: 100%;
   margin: 0px;
   padding: 0px;
   background: repeating-linear-gradient(45deg,
         lightcoral,
         lightcoral 6px,
         #F4A4A4 6px,
         #F4A4A4 12px);
   border-color: lightcoral !important;
   color: black !important;
}

.event-parent-0 {
   width: 100%;
   height: 100%;
   margin: 0px;
   padding: 0px;
   background: #00BFFF;
}

.event-parent-0-low {
   width: 100%;
   height: 100%;
   margin: 0px;
   padding: 0px;
   background: repeating-linear-gradient(45deg,
         #00BFFF,
         #00BFFF 8px,
         #22DFFF 8px,
         #22DFFF 16px);
   border-color: #00BFFF !important;
   color: black !important;
}
</style>