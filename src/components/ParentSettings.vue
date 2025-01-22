<script setup>
import { ref } from 'vue';

const emit = defineEmits(['updateParent', 'removeParent', 'addParent']);

const props = defineProps({
   parents: { type: Object, required: true}});


const newParent = ref({ name: "", salary: 0 });
const editParents = ref(-1);

const updateParent = (id, name, salary) => {
   editParents.value = -1;
   emit('updateParent', id, name, salary);
}

const addParent = () => {
   emit('addParent', newParent.value.name, newParent.value.salary);
   newParent.value = { name: '', salary: 0 };
}

const removeParent = (id) => {
   emit('removeParent', id);
   editParents.value = -1;
}

</script>

<template>
   <h2>{{ $t('parents') }}</h2>
   <div v-if="props.parents">
      <div v-for="parent in props.parents" :key="parent.id">
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
            <button @click="updateParent(parent.id, parent.name, parent.salary)">{{ $t('OK') }}</button>
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
</template>