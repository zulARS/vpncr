<template>
  <div class="app">
    <div class="tabs">
      <button @click="activeTab = 'one'" :class="{ active: activeTab === 'one' }">Staff </button>
      <button @click="activeTab = 'two'" :class="{ active: activeTab === 'two' }">RAGSearch</button>
    </div>

    <div class="tab-content">
      <StaffAdministration v-if="activeTab === 'one'" />
      <RAGSearch v-if="activeTab === 'two'" />
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue'
import StaffAdministration from './components/StaffAdminstration.vue';
import RAGSearch from './components/RAGSearch.vue';

const activeTab = ref('one')

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');

.app {
  max-width: 720px;
  margin: 40px auto;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  font-family: "Quicksand", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}


h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  
}

form input {
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: white;
  transition: border 0.3s;
  font-family: "Quicksand", sans-serif;
}

input[placeholder="Search staff"] {
  grid-column: span 1;
  margin-top: 16px;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: white;
  transition: border 0.3s;
  font-family: "Quicksand", sans-serif;
  transition: width 0.3s ease;
}

ul {
  margin-top: 20px;
  padding-left: 0;
  list-style: none;
}

li {
  background: white;
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

li strong {
  color: #2d3748;
}

li button {
  background: #e53e3e;
  padding: 6px 12px;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-edit{
  background:#31a828;
}

li button:hover {
  background:silver;
}

p {
  margin-top: 16px;
  font-style: italic;
  color: #555;
  text-align: center;
}

.staff-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.staff-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #ccc;
  margin-right: 20px;
}

.list-element1{
  display: flex;
  align-items: center;
}

.search-area {
  width: 100%;
  min-height: 40px;
  max-height: 200px;
  overflow-y: hidden;
  resize: none;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  transition: height 0.2s ease;
}

.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
}
button {
  padding: 10px;
  cursor: pointer;
  background: #ccc;
  border-radius: 6px;
  border: 0;
  font-family: "Quicksand", sans-serif;
}

button:hover {
  background: #adadad;
}

button.active {
  background-color:#2d3748;
  color: white;
  font-weight: bold;
}

.tab-content {
  border: 1px dashed #ccc;
  padding: 10px;
  border-radius: 6px;
}

@media (max-width: 600px) {
  form {
    grid-template-columns: 1fr;
  }

  button {
    grid-column: span 1;
  }
}
</style>
