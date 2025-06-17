const cohere = require('cohere-ai');
cohere.apiKey = process.env.COHERE_API_KEY;

module.exports = cohere
