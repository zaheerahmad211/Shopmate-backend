const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user (Initiate with OTP)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Only allow 'user' or 'seller' from public registration (not admin)
        const allowedRoles = ['user', 'seller'];
        const assignedRole = allowedRoles.includes(role) ? role : 'user';

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // FOR DEVELOPMENT: Log the OTP to terminal if no real email is configured
        if (!process.env.SMTP_USER) {
            console.log(`\n============================`);
            console.log(`[DEBUG - OTP] -> For ${email}: ${otp}`);
            console.log(`============================\n`);
        }

        // Sign a temporary token that expires in 15 minutes
        const tempToken = jwt.sign(
            { name, email, password: hashedPassword, role: assignedRole, otp },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Send email with OTP
        const message = `Welcome to our Marketplace! \n\nYour OTP for registration is: ${otp}\n\nThis OTP is valid for 15 minutes.`;

        await sendEmail({
            email: email,
            subject: 'Marketplace Verification OTP',
            message: message,
        });

        res.status(200).json({
            message: 'OTP sent to email. Please verify.',
            tempToken,
            otp: process.env.SMTP_USER ? undefined : otp // Auto-return OTP for easy dev testing
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify OTP & Create User
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
        return res.status(400).json({ message: 'Please provide token and OTP' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

        if (decoded.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check again if user exists to prevent duplicate registrations
        const userExists = await User.findOne({ email: decoded.email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create the user
        const user = await User.create({
            name: decoded.name,
            email: decoded.email,
            password: decoded.password, // already hashed
            role: decoded.role,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
                cart: user.cart,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
                cart: user.cart, // Return cart
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update User Cart
router.put('/cart', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.cart = req.body.cart || [];
            const updatedUser = await user.save();
            res.json(updatedUser.cart);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
