<template>
  <div class="rag-search">
    <h2>Ask Staff Info (RAG)</h2>
    <small class="info">Since janet is a staff, Ask anything like, who is janet? do you know janet...or it's up to you lah..</small>
    <p></p>
    <input
      v-model="question"
      @keyup.enter="handleRagSearch"
      placeholder="Type your question and press Enter"
      class="ask-rag"
    />
    
    <p></p>
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
          <img v-if="doc.image" :src="`${baseUrl}${doc.image}`" alt="Staff Image" style="max-width: 100px;" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const question = ref('');
const answer = ref('');
const retrievedDocs = ref([]);
const loading = ref(false);
const error = ref('');

async function handleRagSearch() {
  if (!question.value.trim()) return;

  loading.value = true;
  answer.value = '';
  retrievedDocs.value = [];
  error.value = '';

  try {
    const response = await axios.post('http://localhost:5000/api/rag', { question: question.value.trim() });
    answer.value = response.data.answer || 'No answer found.';
    retrievedDocs.value = response.data.retrievedDocs || [];
  } catch (err) {
    error.value = 'Failed to fetch answer.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

const baseUrl = ref('');
onMounted(() => {
  const base = window.location.origin.replace(':8080', ':5000');
  baseUrl.value = base.endsWith('/') ? base.slice(0, -1) : base;
});
</script>

<style scoped>
.rag-search {
  max-width: 600px;
  margin: 2rem auto;
  font-family: Arial, sans-serif;
  font-family: "Quicksand", sans-serif;
}

.ask-rag{
    border-radius: 5px;
    border: 1px solid;
}

input {
  width: 80%;
  padding: 0.5rem;
  margin-right: 0.5rem;
  font-size: 1rem;
  font-family: "Quicksand", sans-serif;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #5a67d8;
  color: #fff;
}

.loading {
  color: #666;
  margin-top: 1rem;

}

.error {
  color: red;
  margin-top: 1rem;
}

.answer-section {
  margin-top: 1.5rem;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
}

.answer-section h3 {
  margin-bottom: 0.5rem;
}

.answer-section ul {
  list-style-type: disc;
  margin-left: 1.2rem;
}
</style>
