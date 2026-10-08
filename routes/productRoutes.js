
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const {
    protect,
    sellerOrAdmin
} = require('../middleware/authMiddleware');

// ======================================================
// GET ALL PRODUCTS
// GET /api/products
// Public
// ======================================================
router.get('/', async (req, res) => {
    try {
        const query = {};

        // Optional seller filter
        if (req.query.seller) {
            query.seller = req.query.seller;
        }

        const products = await Product.find(query).sort({
            createdAt: -1
        });

        return res.status(200).json(products);

    } catch (error) {
        console.error('GET PRODUCTS ERROR:', error);

        return res.status(500).json({
            message: 'Failed to fetch products',
            error: error.message
        });
    }
});

// ======================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// Public
// ======================================================
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        return res.status(200).json(product);

    } catch (error) {
        console.error('GET SINGLE PRODUCT ERROR:', error);

        return res.status(500).json({
            message: 'Failed to fetch product',
            error: error.message
        });
    }
});

// ======================================================
// CREATE PRODUCT
// POST /api/products
// Private - Admin/Seller
// ======================================================
router.post(
    '/',
    protect,
    sellerOrAdmin,
    async (req, res) => {
        try {
            const {
                name,
                price,
                description,
                image,
                category,
                stock
            } = req.body;

            // Basic validation
            if (!name || price === undefined || stock === undefined) {
                return res.status(400).json({
                    message: 'Name, price and stock are required'
                });
            }

            const product = new Product({
                name: name.trim(),
                price,
                description,
                image,
                category,
                stock,
                seller: req.user._id
            });

            const createdProduct = await product.save();

            return res.status(201).json(createdProduct);

        } catch (error) {
            console.error('CREATE PRODUCT ERROR:', error);

            return res.status(500).json({
                message: 'Failed to create product',
                error: error.message
            });
        }
    }
);

// ======================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// Private - Admin/Seller
// ======================================================
router.put(
    '/:id',
    protect,
    sellerOrAdmin,
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            // Sellers can only update their own products
            if (
                req.user.role === 'seller' &&
                product.seller &&
                product.seller.toString() !== req.user._id.toString()
            ) {
                return res.status(401).json({
                    message: 'Not authorized to update this product'
                });
            }

            const {
                name,
                price,
                description,
                image,
                category,
                stock
            } = req.body;

            if (name !== undefined) {
                product.name = name.trim();
            }

            if (price !== undefined) {
                product.price = price;
            }

            if (description !== undefined) {
                product.description = description;
            }

            if (image !== undefined) {
                product.image = image;
            }

            if (category !== undefined) {
                product.category = category;
            }

            if (stock !== undefined) {
                product.stock = stock;
            }

            const updatedProduct = await product.save();

            return res.status(200).json(updatedProduct);

        } catch (error) {
            console.error('UPDATE PRODUCT ERROR:', error);

            return res.status(500).json({
                message: 'Failed to update product',
                error: error.message
            });
        }
    }
);

// ======================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// Private - Admin/Seller
// ======================================================
router.delete(
    '/:id',
    protect,
    sellerOrAdmin,
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            // Sellers can only delete their own products
            if (
                req.user.role === 'seller' &&
                product.seller &&
                product.seller.toString() !== req.user._id.toString()
            ) {
                return res.status(401).json({
                    message: 'Not authorized to delete this product'
                });
            }

            await product.deleteOne();

            return res.status(200).json({
                message: 'Product removed successfully'
            });

        } catch (error) {
            console.error('DELETE PRODUCT ERROR:', error);

            return res.status(500).json({
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }
);

module.exports = router;
