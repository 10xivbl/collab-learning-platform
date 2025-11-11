require('dotenv').config();


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

//midleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//database connection
const connectDB = require('./config/db');
connectDB();

//routes
app.get('/', (req, res) => {
    res.json({
        message: 'API is running...',
        status: 'server is running',
        timestamp: new Date().toISOString()
    });
});

// import and use routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classrooms', require('./routes/classroom'));
app.use('/api/assignments', require('./routes/assignment'));
app.use('/api/submissions', require('./routes/submission'));


//error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'something wrong', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    console.log(`environment: ${process.env.NODE_ENV || 'development'}`);
});
