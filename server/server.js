const express = require('express');
const cors = require('cors');
const embedText = require('./cohere');
const index = require('./pinecone');
//const axios = require('axios');
require('dotenv').config();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const valid = ['image/jpeg', 'image/png', 'image/jpg'];
  if (valid.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json());

// Serve Vue build from root/dist
app.use(express.static(path.join(__dirname, '../dist')));

// Handle SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
//upsert operation

// app.post('/api/upsert', async (req, res) => {
//   const { id, name, position, department } = req.body;
//   const metadata = { id, name, position, department };
//   const vector = await embedText(`${name} ${position} ${department}`);
//   await index.upsert([{ id, values: vector, metadata }]);
//   res.json({ message: 'Staff added' });
// });

// app.post('/api/upsert', upload.single('image'), async (req, res) => {
//   try {
//     const { id, name, position, department } = req.body;

//     if (!id || !name || !position || !department) {
//       return res.status(400).json({ error: 'Missing fields' });
//     }

//     const image = req.file ? req.file.filename.replace(/^uploads\//, '') : null;
//     const metadata = { id, name, position, department, image, tags: ['information technology', 'it', 'developer', 'engineer'] };
//     const vector = await embedText(`${name} ${position} ${department}`, 'search_document');
//     await index.upsert([{ id, values: vector, metadata }]);
//     res.json({ message: 'Staff added' });

//   } catch (err) {
//     console.error('Upsert error:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// //for uploading image
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// .replace(/^uploads\//, '')
app.post('/api/upsert', upload.single('image'), async (req, res) => {
  try {
    let { id, name, position, department, existingImage } = req.body;
    id = id.trim(); // prevent ID mismatch due to extra spaces

    if (!id || !name || !position || !department) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const tags = [];
    const lowerPosition = position.toLowerCase();
    const lowerDepartment = department.toLowerCase();

    if (lowerPosition.includes('developer')) tags.push('dev', 'developer', 'it');
    if (lowerDepartment.includes('hr')) tags.push('hr', 'human resources');
    if (lowerDepartment.includes('admin')) tags.push('admin', 'administration');
    if (lowerDepartment.includes('it') || lowerPosition.includes('it')) tags.push('it', 'information technology');

    const uniqueTags = [...new Set(tags)];
    if (uniqueTags.length === 0) uniqueTags.push('general');

    // Step 1: Fetch existing metadata
    let existingMetadata = {};
    try {
      const existingVector = await index.fetch([id]);
      if (existingVector?.vectors?.[id]?.metadata) {
        existingMetadata = existingVector.vectors[id].metadata;
        console.log('Existing metadata:', existingMetadata);
      }
    } catch (e) {
      console.warn('Metadata fetch failed or not found:', e);
    }

    // Decide which image to retain or update
    const imageFilename =
      req.file?.filename.replace(/^uploads\//, '') || existingImage || existingMetadata.image || '';

    // Generate vector BEFORE upsert
    const vector = await embedText(`${name} ${position} ${department}`, 'search_document');

    // Construct metadata
    const metadata = {
      id,
      name,
      position,
      department,
      tags: uniqueTags,
      image: imageFilename,
    };

    // ✅ Step 5: Upsert into Pinecone
    await index.upsert([{ id, values: vector, metadata }]);

    res.json({ message: 'Staff updated' });
  } catch (err) {
    console.error('Upsert error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//search operation
app.post('/api/search', async (req, res) => {
  try {
    let { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid search query' });
    }

    const expansions = {
      it: 'information technology',
      hr: 'human resources',
      dev: 'developer',
      admin: 'administration',
      assistant: 'human resources'
    };

    const lowerQuery = query.toLowerCase();

    Object.entries(expansions).forEach(([key, val]) => {
      if (lowerQuery.includes(key) && !lowerQuery.includes(val)) {
        query += ` ${val}`;
      }
    });

    const vector = await embedText(query, 'search_query');

    const result = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    const filtered = result.matches.filter(match => {
      const meta = match.metadata;
      const hasVectorMatch = match.score >= 0.4;
      const lowerName = meta?.name?.toLowerCase() || '';
      const hasNameMatch = lowerName.includes(lowerQuery);
      const hasTagMatch = meta?.tags?.some(tag =>
        tag.toLowerCase().includes(lowerQuery)
      );
      return hasVectorMatch || hasTagMatch || hasNameMatch;
    });

    const formatted = filtered.map(match => ({
      id: match.id,
      score: match.score,
      metadata: {
        name: match.metadata.name,
        position: match.metadata.position,
        department: match.metadata.department,
        tags: match.metadata.tags || [],
        image: match.metadata.image ? `/${match.metadata.image}` : null,
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});



app.delete('/api/delete/:id', async (req, res) => {
  const staffId = req.params.id;

  if (!staffId) {
    return res.status(400).json({ error: 'Missing staff ID' });
  }

  try {
    // Optionally: Log or verify the ID
    console.log(`Attempting to delete staff ID: ${staffId}`);

    // Perform delete in Pinecone
    await index._deleteOne(staffId);

    res.json({ message: `Staff with ID ${staffId} deleted.` });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

//rag
// ADD this to your server.js
app.post('/api/rag', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Missing question' });

    // Embed the question
    const vector = await embedText(question, 'search_query');

    // Query Pinecone
    const result = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    // Extract docs with metadata & format image URLs
    const docs = result.matches.map(m => {
      const meta = m.metadata;
      return {
        name: meta.name,
        position: meta.position,
        department: meta.department,
        image: meta.image ? `/uploads/${meta.image}` : null,
        tags: meta.tags || [],
      };
    });

    // Build a clear, numbered context string for RAG prompt
    const context = docs.map((doc, idx) => 
      `Staff ${idx + 1}:
      Name: ${doc.name}
      Position: ${doc.position}
      Department: ${doc.department}
      Tags: ${doc.tags.length ? doc.tags.join(', ') : 'N/A'}`
    ).join('\n\n');

    // Call Cohere with the context and question
    const { CohereClient } = require('cohere-ai');
    const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

    const chatResponse = await cohere.chat({
      model: 'command-r-plus',
      message: `Answer the following question based on this staff information:\n\n${context}\n\nQ: ${question}`,
      temperature: 0.3,
    });

    const answer = chatResponse.text || 'No answer found.';

    res.json({ answer, retrievedDocs: docs });
  } catch (err) {
    console.error('RAG ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch answer' });
  }
});

app.listen(process.env.PORT, () => console.log(`Server running at port ${process.env.PORT}`));
