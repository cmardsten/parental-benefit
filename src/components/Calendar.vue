  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';

  const activeTab = ref('pattern');

  const today = new Date();
  const newChild = ref({
        name: "",
        id: -1,
        birthdate: today.toISOString().substring(0, 10),
        parentalLeaveDays: {
                mother: {
                    transferable: {
                        low: 45,
                        high: 105
                    },
                    reserved: 90,
                },
                father: {
                    transferable: {
                        low: 45,
                        high: 105
                    },
                    reserved: 90,
                }
            }
        });

        const parents = ref({
            father: { isDefined: false, name: '', salary: 0 },
            mother: { isDefined: false, name: '', salary: 0 }
        });
      const selectedParent = ref(null);


  // Track the total remaining days for each parent across all children
  const totalRemainingDays = computed(() => {
  return children.value.reduce(
    (totals, child) => {
      totals.mother.high += child.parentalLeaveDays.mother.transferable.high + child.parentalLeaveDays.mother.reserved;
      totals.mother.low += child.parentalLeaveDays.mother.transferable.low;
      totals.father.high += child.parentalLeaveDays.father.transferable.high + child.parentalLeaveDays.father.reserved;
      totals.father.low += child.parentalLeaveDays.father.transferable.low;
      return totals;
    },
    { mother: { high: 0, low: 0 }, father: { high: 0, low: 0 } }
    );
    });

// Computed property to calculate remaining days for each child
const childrenWithRemainingDays = computed(() =>
  children.value.map(child => {
    const { mother, father } = child.parentalLeaveDays;

    const totalHigh =
      mother.transferable.high +
      mother.reserved +
      father.transferable.high +
      father.reserved;

    const totalLow =
      mother.transferable.low +
      father.transferable.low;

    return {
      ...child,
      remainingDays: {
        high: totalHigh,
        low: totalLow,
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
        calculatedDate.setDate(calculatedDate.getDate() + weeks * 7);
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
            eventClick: function(info) {
                info.jsEvent.preventDefault(); // don't let the browser navigate
                if (confirm("Do you want to remove the parental day?") == true) {
                    removeEvent(info.event.id);
                };
            },
            eventDidMount: (info) => {
                // Add a class based on the event's person field
                const parent = info.event.extendedProps.parent;
                var parentClass = `parent-${parent}`;
                if (info.event.extendedProps.isLowLevel == true)
                {
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

    let highestEventId = 0;
    const generatePattern = () => {
       const start = new Date(startDate.value);
       const end = new Date(endDate.value);
       for (let currentDate = start; currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
         const dayName = weekDays[(currentDate.getDay() + 6) % 7]; // Get day, but 0 for Monday
         const percentage = pattern.value[dayName].percentage;
         if (percentage > 0)
         {
            const isLowLevel = pattern.value[dayName].isLowLevel;
            const pay = calculateDayPay(selectedParent.value.salary, percentage, isLowLevel);
            var lowLevelString = "";
            if (isLowLevel)
            {
                lowLevelString = " (L)"
            }

            const child = children.value[0];
            const parent = Object.keys(parents.value).find(key => parents.value[key].name === selectedParent.value.name);
            const dayType = isLowLevel ? "low" : "high";
            const decimalDay = percentage / 100;
            // Subtract a day from the specified parent and day type
            if (isLowLevel)
            {
                if (child.parentalLeaveDays[parent].transferable.low >= decimalDay)
                {
                    child.parentalLeaveDays[parent].transferable.low -= decimalDay;
                }
                else
                {
                    alert("No low days left. You need to transfer days.");
                }
            }
            else
            {
                if (child.parentalLeaveDays[parent].reserved >= decimalDay)
                {
                    child.parentalLeaveDays[parent].reserved -= decimalDay;
                }
                else if (child.parentalLeaveDays[parent].transferable.high >= decimalDay)
                {
                    child.parentalLeaveDays[parent].transferable.high -= decimalDay;
                }
            }

            // Create the event object
            console.log(Object.keys(selectedParent.value));
            const newEvent = {
                title: `${selectedParent.value.name.charAt(0)} ${percentage}% ${pay.toFixed(0)} kr${lowLevelString}`,
                start: currentDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
                person: selectedParent.value.name,
                parent: parent,
                percentage: percentage,
                isLowLevel: isLowLevel,
                pay: pay,
                childId: 0, // TODO: Enable selecting which child to use day from
                id: highestEventId,
            };
            highestEventId++;
            events.value.push(newEvent);
          }
        }
    }

    const removeEvent = (id) => {
    const event = events.value.find(e => e.id == id);
    if (event) {
        const { parent, percentage, isLowLevel, childId } = event;
        const daysToAdd = percentage / 100;
        const child = children.value.find(child => child.id === childId);

        if (child) {
            if (isLowLevel)
            {
                // Transferable low level days
                if (child.parentalLeaveDays[parent].transferable.low < 90) {
                    const availableToReserve = 90 - child.parentalLeaveDays[parent].reserved;
                    const daysToReserve = Math.min(daysToAdd, availableToReserve);
                    child.parentalLeaveDays[parent].transferable.low += daysToReserve;
                }
            }
            else
            {
                let remainingDays = daysToAdd;
                // Reserved days
                if (child.parentalLeaveDays[parent].reserved < 90) {
                    const availableToReserve = 90 - child.parentalLeaveDays[parent].reserved;
                    const daysToReserve = Math.min(daysToAdd, availableToReserve);
                    child.parentalLeaveDays[parent].reserved += daysToReserve;
                    remainingDays -= daysToReserve;
                }        
                // Transferable high level days
                if (remainingDays > 0) {
                    child.parentalLeaveDays[parent].transferable.high += remainingDays;
                }
            }
        }
        events.value = events.value.filter(e => e.id != id);
    }
};

    const saveCalendar = () => {
      localStorage.setItem('savedEvents', JSON.stringify(events.value));
      alert('Calendar events saved!');
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
      if (savedChildren)
      {
        children.value = JSON.parse(savedChildren);
      }
    }

    const loadParents = () => {
      const savedParents = localStorage.getItem('savedParents');
      if (savedParents)
      {
        parents.value = JSON.parse(savedParents);
      }
    }

    // Clear events from Local Storage and events ref
    const clearCalendar = () => {
      events.value = [];
      children.value.forEach(child => {
            child.parentalLeaveDays.mother.reserved = 90;
            child.parentalLeaveDays.mother.transferable.high = 105;
            child.parentalLeaveDays.mother.transferable.low = 45;
            child.parentalLeaveDays.father.reserved = 90;
            child.parentalLeaveDays.father.transferable.high = 105;
            child.parentalLeaveDays.father.transferable.low = 45;
        });
    }

    const addChild = () => {
        let highestId = -1;
        children.value.forEach(child => {
            if (child.id > highestId)
            {
                highestId = child.id;
            }
        });
        newChild.value.id = highestId + 1;
        children.value.push(newChild.value);
        saveChildren();
    }

    const removeChild = (id) => {
        const childIndex = children.value.findIndex(child => child.id == id);
        if (childIndex > -1)
        {
            children.value.splice(childIndex);
        }
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
            <div class="tabs">
                <button @click="activeTab = 'pattern'">Pattern Settings</button>
                <button @click="activeTab = 'child'">Children</button>
                <button @click="activeTab = 'parents'">Parents</button>
            </div>

            <!-- Generate pattern tab -->
            <div v-if="activeTab === 'pattern'" class="settings-form">
                <form @submit.prevent="generatePattern">
                    <!-- Person Selector -->
                    <label for="person">Select Person:</label>
                    <select v-model="selectedParent">
                    <option v-if="parents.mother.isDefined" :value="parents.mother">{{ parents.mother.name }}</option>
                    <option v-if="parents.father.isDefined" :value="parents.father">{{ parents.father.name }}</option>
                    </select>
                    <label>Monthly salary:</label>
                    <input v-if="selectedParent" type="number" v-model="selectedParent.salary"/>
                    <h3>Weekly Pattern</h3>
                    <table class="pattern-table">
                    <tr v-for="day in weekDays" :key="day">
                    <td>{{ day }}</td>
                    <td class="pattern-table-right">
                        <select v-model="pattern[day].percentage">
                        <option v-for="ratio in ratios" :key="ratio.id" :value="ratio.ratio">{{ ratio.ratio }}%</option>
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
                        <input type="date"
                        :value="startDate"
                        @input="updateDates('startDate', $event.target.value)"/>
                    </td>   
                    </tr>
                    <tr>
                    <td>
                        <label for="endDate">End date</label>
                    </td>
                    <td>
                        <input type="date"
                        :value="endDate"
                        @input="updateDates('endDate', $event.target.value)"/>
                        <span>
                        =
                            <input type="number"
                                :value="repeatDuration"
                                @input="updateDates('repeatDuration', $event.target.value)"
                                placeholder="Number of weeks"
                                min=0
                                style="width: 2.5em;"/>
                            <label for="repeatDuration">weeks</label>
                        </span>
                    </td>
                    </tr>
                    </table>
                    <button type="submit">Generate Pattern</button>
                </form>
            </div>

            <!-- Children tab -->
            <div v-if="activeTab === 'child'" class="settings-form">
                <h2>Children</h2>
                <div v-if=children>
                    <div v-for="child in childrenWithRemainingDays" :key="child.name">
                        <h4>{{ child.birthdate }} : {{ child.name }}</h4>
                        <p>Sickness Benefit Level Days Left: {{ child.remainingDays.high }}</p>
                        <p>Low Level Days Left: {{ child.remainingDays.low }}</p>
                        <button @click="removeChild(child.id)">Remove</button>
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

                <label for="salary">Monthly Salary:</label>
                <input type="number" min=0 v-model="parents.father.salary" placeholder="Enter fathers's monthly salary" />

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

                <label for="salary">Monthly Salary:</label>
                <input type="number" min=0 v-model="parents.mother.salary" placeholder="Enter mothers's monthly salary" />

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
  gap: 5px; /* Space between checkbox and label */
}

.parent-father {
  background-color: #00BFFF !important;
  border-color: #00BFFF !important;
  color: white !important;
}

.parent-father-low {
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

.parent-mother {
  background-color: lightcoral !important;
  border-color: lightcoral !important;
  color: white !important;
}

.parent-mother-low {
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

input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;}

</style>
  