const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect, admin, sellerOrAdmin } = require('../middleware/authMiddleware');

// @desc    Create new message
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
    const { name, email, message, user, recipient } = req.body;

    try {
        const newMessage = await Message.create({
            name,
            email,
            message,
            user: user || null,
            recipient: recipient || null
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get messages for a seller
// @route   GET /api/messages/seller
// @access  Private/Seller/Admin
router.get('/seller', protect, sellerOrAdmin, async (req, res) => {
    try {
        const messages = await Message.find({ recipient: req.user._id }).populate('user', 'name email profilePicture');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const messages = await Message.find({}).populate('user', 'profilePicture role');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (message) {
            await message.deleteOne();
            res.json({ message: 'Message removed' });
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
