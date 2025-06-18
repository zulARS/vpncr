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
      <p v-if="!imageFile && imagePreview">Using existing image. To change, upload a new one.</p>
    </form>
    <h1>Vector Search</h1>
    <!-- <input v-model="searchQuery" placeholder="Search staff" @input="handleSearch" :style="{ width: `${searchQuery.length * 10 + 100}px` }"/> -->
    <textarea
      v-model="searchQuery"
      placeholder="Search staff here"
      @input="handleSearch"
      ref="searchBox"
      class="search-area"
    />
    
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

  <div :class="notesClass">
  <div @click="hideNotes"><small style="cursor: pointer">[close]</small></div>
  <ul>
      <li>Example staff added: Michael, Brad, Janet</li>
      <li>Need to manually refresh page after new staff added.</li>
  </ul>
</div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
const BASE_URL = process.env.VUE_APP_BASE_URL

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
const notesClass = ref('notes')

const hideNotes = () => {
  notesClass.value = notesClass.value === 'notes' ? 'hideNotes': 'notes'
}

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
  return `${BASE_URL}/uploads/${image.replace(/^\/+/, '')}`;
};

const editStaff = (staff) => {
  id.value = staff.id;
  name.value = staff.metadata.name;
  position.value = staff.metadata.position;
  department.value = staff.metadata.department;
  //imagePreview.value = staff.metadata.image || null;
  
  imagePreview.value = staff.metadata.image
  ? `${BASE_URL}/${staff.metadata.image.replace(/^\/?uploads\//, '')}`
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

  if (imageFile.value) {
    formData.append('image', imageFile.value);
  } else if (imagePreview.value) {
    // Send existing image filename (strip full URL)
    const filename = imagePreview.value.split('/').pop();
    formData.append('existingImage', filename);
    console.log("Sending existing image filename:", filename);
  }

  try {
    await axios.post(`${BASE_URL}/api/upsert`, formData, {
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
      const res = await axios.post(`${BASE_URL}/api/search`, {
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
    await axios.delete(`${BASE_URL}/api/delete/${staffId}`);
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
/* Base Mobile-First Styles */
.hideNotes{
  display: none;
  cursor: pointer;
}

.app {
  padding: 15px;
  max-width: 100%;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.2rem;
  color: #2c3e50;
  text-align: center;
}

/* Form Styles */
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

input, textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

input[type="file"] {
  padding: 8px 0;
  border: none;
}

/* Button Styles */
.staff-btn, .btn-edit {
  background-color: #42b983;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 8px;
  transition: background-color 0.2s;
}

.staff-btn:hover, .btn-edit:hover {
  background-color: #3aa876;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

/* Search Results */
.search-area {
  min-height: 80px;
  width: 100%;
  margin-bottom: 15px;
  resize: vertical;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.list-element1 {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
  overflow: hidden;
}

.staff-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

/* Image Preview */
img[alt="Preview"] {
  display: block;
  max-width: 80px;
  height: auto;
  border-radius: 4px;
  margin: 8px auto;
}

/* For notes panel - fixed position at bottom */
.notes-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f8f9fa;
  padding: 15px;
  border-top: 1px solid #ddd;
  z-index: 100;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
}

/* When notes are hidden */
.notes-panel.hidden {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}

/* Transition for smooth show/hide */
.notes-panel {
  transition: all 0.3s ease;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .app {
    max-width: 600px;
    margin: 0 auto;
  }
  
  li {
    padding: 15px 20px;
  }
  
  .staff-image {
    width: 50px;
    height: 50px;
  }
}

/* Utility Classes */
p {
  font-size: 0.9rem;
  color: #666;
  margin: 5px 0;
}

small {
  font-size: 0.8rem;
  color: #999;
}

b {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notes{
  display: block;
  position: absolute;
  border: 1px dashed gray;
  font-size: 13px;
  width: 250px;
  overflow: hidden;
  font-family:'Courier New', Courier, monospace;
  right: 50px;
  top: 50px;
}

.notes center{
  font-size: 15px;
  font-weight: bold;
}

.notes ul li{
  box-sizing: border-box;
}
</style>