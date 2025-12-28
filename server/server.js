require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// midleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static frontend
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// database connection
const connectDB = require('./config/db');
connectDB();

// health/status endpoint (JSON)
app.get('/status', (req, res) => {
    res.json({
        message: 'API is running...',
        status: 'server is running',
        timestamp: new Date().toISOString()
    });
});

// landing page: auth first, app after login
app.get('/', (req, res) => {
    console.log('Root route hit, serving auth.html');
    const filePath = path.join(publicDir, 'auth.html');
    console.log('File path:', filePath);
    res.sendFile(filePath);
});

// main app shell
app.get('/app', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Keep old client for testing/development
app.get('/dev', (req, res) => {
    res.sendFile(path.join(publicDir, 'client.html'));
});

// import and use routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classrooms', require('./routes/classroom'));
app.use('/api/assignments', require('./routes/assignment'));
app.use('/api/submissions', require('./routes/submission'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/announcements', require('./routes/announcement'));

// error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'something wrong',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    console.log(`environment: ${process.env.NODE_ENV || 'development'}`);
});
