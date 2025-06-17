const axios = require('axios');
require('dotenv').config();

/**
 
 * @param {string} text - Text to embed
 * @param {string} inputType - 'search_document' for upsert, 'search_query' for search
 * @returns {Promise<number[]>} - Embedding vector
 */

async function embedText(text, inputType = 'search_document') {
  const response = await axios.post(
    'https://api.cohere.ai/v1/embed',
    {
      texts: [text],
      model: 'embed-english-v3.0',
      input_type: inputType
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  //return response.data.embeddings[0];
  const embedding = response.data.embeddings[0];
  console.log(`Embedding for [${inputType}]:`, embedding.slice(0, 5)); // log first 5 values
  return embedding;
}

module.exports = embedText;
