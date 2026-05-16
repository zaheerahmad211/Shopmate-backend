const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: String, // Changed from ObjectId to String to accept external IDs
                required: true,
            },
            seller: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        address: String,
        city: String,
        postalCode: String,
        country: String,
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
