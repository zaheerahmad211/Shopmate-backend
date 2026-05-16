const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin, sellerOrAdmin } = require('../middleware/authMiddleware');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.seller) {
            query.seller = req.query.seller;
        }
        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin/Seller
router.post('/', protect, sellerOrAdmin, async (req, res) => {
    const { name, price, description, image, category, stock } = req.body;

    try {
        const product = new Product({
            name,
            price,
            description,
            image,
            category,
            stock,
            seller: req.user._id, // Assign seller id from authenticated user
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin/Seller
router.put('/:id', protect, sellerOrAdmin, async (req, res) => {
    const { name, price, description, image, category, stock } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // If user is a seller, make sure they own the product
            if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to update this product' });
            }

            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.image = image || product.image;
            product.category = category || product.category;
            product.stock = stock || product.stock;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin/Seller
router.delete('/:id', protect, sellerOrAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Check ownership for sellers
            if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to delete this product' });
            }

            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
