<template>
  <div class="app">
    <h1>Staff Registration</h1>

    <form @submit.prevent="handleUpsert" enctype="multipart/form-data">
      <input v-model="id" placeholder="ID" required />
      <input v-model="name" placeholder="Name" required />
      <input v-model="position" placeholder="Position" required />
      <input v-model="department" placeholder="Department" required />
      <input type="file" @change="handleFileUpload" accept="image/*" />
      <img v-if="imagePreview" :src="imagePreview" alt="Preview" style="max-width: 120px; margin-top: 10px;" />
      <button type="submit" class="staff-btn">Save Staff</button>
    </form>

    <!-- <input v-model="searchQuery" placeholder="Search staff" @input="handleSearch" :style="{ width: `${searchQuery.length * 10 + 100}px` }"/> -->
    <p><b>This search is based on vector search. For the natural language search please click RAGSearch button above. TQ ;-)</b></p>
    
    <textarea
      v-model="searchQuery"
      placeholder="Search staff"
      @input="handleSearch"
      ref="searchBox"
      class="search-area"
    />
    <p>Sample staff already added in database: Michael, Janet and Brad</p>
    <p v-if="isSearching">Searching...</p>

    <ul v-if="!isSearching && results.length > 0">
      <li v-for="staff in results" :key="staff.id" >
        <div class="list-element1">
          <img
          v-if="staff.metadata.image"
          :src="getImageUrl(staff.metadata.image)"
          alt="Staff Image"
          class="staff-image"/>
          <b>
              {{ staff.metadata.name }}, Position: {{ staff.metadata.position }}, Department: ({{ staff.metadata.department }})
          </b> 
        </div>
         <div>
          <button @click="editStaff(staff)" class="btn-edit"><img src="../assets/editing.png" width="20px"></button>
          <button @click="deleteStaff(staff.id)"><img src="../assets/delete.png" width="20px"></button>
         </div>   
        
      </li>
    </ul>

    <!-- Show "no results" only after search finishes -->
    <p v-else-if="!isSearching && searchQuery">No matching staff found.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const id = ref('');
const name = ref('');
const position = ref('');
const department = ref('');
const searchQuery = ref('');
const results = ref([]);
const isSearching = ref(false);
const imageFile = ref(null);
const imagePreview = ref(null);
const isEditing = ref(false);
const editingId = ref(null);
const searchBox = ref(null);

const autoResize = () => {
  const el = searchBox.value;
  if (!el) return;
  el.style.height = 'auto'; // reset height
  el.style.height = `${el.scrollHeight}px`; // adjust to content
};

watch(searchQuery, autoResize);
onMounted(autoResize);

const getImageUrl = (image) => {
  if (!image) return '';
  return `http://localhost:5000/uploads/${image.replace(/^\/+/, '')}`;
};

const editStaff = (staff) => {
  id.value = staff.id;
  name.value = staff.metadata.name;
  position.value = staff.metadata.position;
  department.value = staff.metadata.department;
  //imagePreview.value = staff.metadata.image || null;
  
  imagePreview.value = staff.metadata.image
  ? `http://localhost:5000/uploads/${staff.metadata.image.replace(/^\/?uploads\//, '')}`
  : null;

  // Fix: use full image URL
  imagePreview.value = staff.metadata.image
    ? getImageUrl(staff.metadata.image)
    : null;

  isEditing.value = true;
  editingId.value = staff.id;
};

const handleUpsert = async () => {
  const formData = new FormData();
  formData.append('id', id.value);
  formData.append('name', name.value);
  formData.append('position', position.value);
  formData.append('department', department.value);
  if (imageFile.value) formData.append('image', imageFile.value);

  try {
    await axios.post('http://localhost:5000/api/upsert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    alert('Saved');
    clearForm();
  } catch (err) {
    alert('Upload failed');
    console.error(err);
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 2 * 1024 * 1024;

  if (!file) return;

  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG and PNG files are allowed.');
    return;
  }

  if (file.size > maxSize) {
    alert('Max file size is 2MB.');
    return;
  }

  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};


let searchTimeout;

const handleSearch = () => {
  clearTimeout(searchTimeout);
  isSearching.value = true;

  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim() === '') {
      results.value = [];
      isSearching.value = false;
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/search', {
        query: searchQuery.value
      });
      results.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error("Search failed:", err);
      results.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 500); // Delay to wait for user to finish typing
};

const deleteStaff = async (staffId) => {
  const confirmed = confirm('Are you sure you want to delete this staff member?');

  if (!confirmed) return;

  try {
    await axios.delete(`http://localhost:5000/api/delete/${staffId}`);
    results.value = results.value.filter((s) => s.id !== staffId);
    alert('Staff deleted successfully.');
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete staff.');
  }
};


const clearForm = () => {
  id.value = name.value = position.value = department.value = '';
  imageFile.value = null;
  imagePreview.value = null;
};
</script>

<style scoped>
form input:focus {
  border-color: #5a67d8;
  outline: none;
}

.staff-btn {
  grid-column: span 2;
  padding: 10px 16px;
  font-size: 16px;
  background: #5a67d8;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  font-family: "Quicksand", sans-serif;
}

.staff-btn:hover {
  background: #434190;
}
</style>