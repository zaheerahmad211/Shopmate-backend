
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ===============================
// CORS CONFIGURATION
// ===============================
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://shopmate-frontend-six.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from Postman, Thunder Client, etc.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());

// ===============================
// DATABASE CONNECTION
// ===============================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

// ===============================
// TEST ROUTE
// ===============================
app.get('/', (req, res) => {
    res.send('API is running...');
});

// ===============================
// ROUTES
// ===============================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// ===============================
// USE ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// ===============================
// STATIC UPLOADS
// ===============================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// PORT
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
