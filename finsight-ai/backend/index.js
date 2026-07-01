const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Groq } = require('groq-sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Finsight-ai backend listening on port ${port}`);
});
