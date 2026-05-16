const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  cart: [
    {
      product: { type: String, required: true }, // Store as String to accommodate FakeStoreAPI IDs (numbers/strings)
      name: String,
      image: String,
      price: Number,
      countInStock: Number,
      quantity: { type: Number, default: 1 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
