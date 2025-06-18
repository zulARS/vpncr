<template>
  <div class="rag-search">
    <h2>Ask Staff Info (RAG)</h2>
    <p></p>
    <input
      v-model="question"
      @keyup.enter="handleRagSearch"
      placeholder="Type your question and press Enter"
      class="ask-rag"
    />
    
    <button @click="handleRagSearch" :disabled="loading || !question.trim()">Ask</button>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="answer" class="answer-section">
      <h3>Answer:</h3>
      <p>{{ answer }}</p>

      <h4>Retrieved Documents:</h4>
      <ul>
        <li v-for="(doc, i) in retrievedDocs" :key="i">
          <p><strong>{{ doc.name }}</strong> - {{ doc.position }} ({{ doc.department }})</p>
          <img v-if="doc.image" :src="getImageUrl(doc.image)" alt="Staff Image" style="max-width: 100px;" />
        </li>
      </ul>
    </div>
  </div>

<div :class="notesClass">
  <div @click="hideNotes"><small style="cursor: pointer">[close]</small></div>
  <ul>
      <li>Since janet is a staff, Ask anything like, who is janet? do you know janet...or it's up to you lah..</li>
  </ul>
</div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
const BASE_URL = process.env.VUE_APP_BASE_URL

const question = ref('');
const answer = ref('');
const retrievedDocs = ref([]);
const loading = ref(false);
const error = ref('');
const notesClass = ref('notes')

const hideNotes = () => {
  notesClass.value = notesClass.value === 'notes' ? 'hideNotes': 'notes'
}

async function handleRagSearch() {
  if (!question.value.trim()) return;

  loading.value = true;
  answer.value = '';
  retrievedDocs.value = [];
  error.value = '';

  try {
    const response = await axios.post(`${BASE_URL}/api/rag`, { question: question.value.trim() });
    answer.value = response.data.answer || 'No answer found.';
    retrievedDocs.value = response.data.retrievedDocs || [];
  } catch (err) {
    error.value = 'Failed to fetch answer.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

const getImageUrl = (image) => {
  if (!image) return '';
  return `${BASE_URL}/${image.replace(/^\/+/, '')}`;
};

</script>


<style scoped>
.hideNotes{
  display: none;
  cursor: pointer;
}

/* Base Styles - Mobile First */
.rag-search {
  max-width: 100%;
  padding: 1rem;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  text-align: center;
}

/* Search Input */
.ask-rag {
  width: 100%;
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

/* Button */
button {
  width: 100%;
  padding: 0.8rem;
  margin: 0.5rem 0;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #3aa876;
}

/* Results Section */
.answer-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

h3, h4 {
  color: #2c3e50;
  margin: 0.8rem 0 0.5rem;
}

h3 {
  font-size: 1.3rem;
}

h4 {
  font-size: 1.1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

li {
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Staff Images */
img {
  max-width: 80px;
  height: auto;
  border-radius: 4px;
  margin-top: 0.5rem;
  display: block;
}

/* Status Messages */
.loading, .error {
  padding: 0.8rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  text-align: center;
}

.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.error {
  background-color: #ffebee;
  color: #d32f2f;
}

/* Notes Panel */
.notes-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f8f9fa;
  padding: 1rem;
  border-top: 1px solid #ddd;
  z-index: 100;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.notes-panel.hidden {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}

.notes-panel small {
  display: block;
  text-align: right;
  margin-bottom: 0.5rem;
  color: #666;
}

.notes-panel ul {
  margin: 0;
}

.notes-panel li {
  background: transparent;
  box-shadow: none;
  padding: 0.3rem 0;
  font-size: 0.9rem;
  color: #555;
}

/* Desktop Adjustments */
@media (min-width: 768px) {
  .rag-search {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .ask-rag {
    padding: 1rem;
  }
  
  button {
    width: auto;
    min-width: 120px;
    padding: 1rem 1.5rem;
    display: inline-block;
    margin-left: 0.5rem;
  }
  
  .notes-panel {
    max-width: 600px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 8px 8px 0 0;
  }
  
  .notes-panel.hidden {
    transform: translateX(-50%) translateY(100%);
  }
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