
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ==========================================
// CORS
// ==========================================
app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

// ==========================================
// BODY PARSER
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// DATABASE CONNECTION
// ==========================================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err.message);
    });

// ==========================================
// ROOT ROUTE
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Shopmate API is running...',
        status: 'success'
    });
});

// ==========================================
// API TEST ROUTE
// ==========================================
app.get('/api/test', (req, res) => {
    res.status(200).json({
        message: 'API routing is working',
        status: 'success'
    });
});

// ==========================================
// IMPORT ROUTES
// ==========================================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// ==========================================
// STATIC UPLOADS
// ==========================================
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);

    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message
    });
});

// ==========================================
// LOCAL SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// ==========================================
// VERCEL
// ==========================================
module.exports = app;
