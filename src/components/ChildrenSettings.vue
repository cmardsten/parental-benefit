<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['updateChild', 'removeChild', 'addChild']);

const props = defineProps({
   children: { type: Object, required: true},
   parents: { type: Object, required: true}});


const newChild = ref({ name: "", birthdate: new Date().toISOString().substring(0, 10) });
const editChildren = ref(-1);
const adjustedDays = ref(null);
const adjustedDoubleDays = ref(null);

const editChild = (id) => {
   const child = props.children.find(child => child.id === id)
   adjustedDays.value = child.parentalLeaveDays.getAllDays();
   console.log(adjustedDays.value);
   adjustedDoubleDays.value = child.parentalLeaveDays.getDoubleDaysLeft();
   console.log(adjustedDoubleDays.value);
   editChildren.value = id;
}

const getParentNameFromId = (id) => {
   const parent = props.parents.find(p => p.id == id);
   return parent.name
}

const updateChild = (id) => {
   editChildren.value = -1;
   emit('updateChild', id, adjustedDays.value, adjustedDoubleDays.value);
}

const addChild = () => {
   emit('addChild', newChild.value.name, newChild.value.birthdate);
   newChild.value = { name: '', salary: 0 };
}

const removeChild = (id) => {
   emit('removeChild', id);
   editChildren.value = -1;
}

// Computed property to calculate remaining days for each child
const childrenWithRemainingDays = computed(() =>
   props.children.map(child => {
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

</script>

<template>
   <div>
      <h2>{{ $t('children') }}</h2>
      <div v-if=props.children>
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
      <div v-if="props.parents.length > 0">
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
</template>