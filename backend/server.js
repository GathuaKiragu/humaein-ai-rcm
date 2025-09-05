const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.static('public')); // serve uploaded files

// MongoDB Connection (we'll use a free MongoDB Atlas cluster)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/humaein-rcm')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route for health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Humaein RCM API is running!' });
});

// We will add more routes here later

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});