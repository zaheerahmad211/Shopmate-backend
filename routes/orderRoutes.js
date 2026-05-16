const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin, sellerOrAdmin } = require('../middleware/authMiddleware');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    console.log('Place Order Body:', req.body); // Debug log

    if (!orderItems || orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        try {
            const order = new Order({
                user: req.user._id,
                items: orderItems.map((x) => ({
                    product: x.product || x.id || Date.now().toString(), // Robust fallback for missing IDs
                    name: x.title || x.name || 'Unknown Product',
                    qty: x.quantity || x.qty || 1,
                    image: x.image || '',
                    price: x.price || 0,
                    seller: x.seller || null, // Capture seller ID if provided
                })),
                totalAmount: totalPrice,
                shippingAddress,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
            });

            const createdOrder = await order.save();
            res.status(201).json(createdOrder);
        } catch (error) {
            console.error('Order Create Error:', error);
            res.status(500).json({ message: error.message });
        }
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email profilePicture');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get orders for a seller
// @route   GET /api/orders/seller
// @access  Private/Seller/Admin
router.get('/seller', protect, sellerOrAdmin, async (req, res) => {
    try {
        // 1. Get all products belonging to this seller
        const products = await Product.find({ seller: req.user._id });
        const productIds = products.map(p => p._id.toString());

        // 2. Find orders that contain at least one of these products
        const orders = await Order.find({
            'items.product': { $in: productIds }
        }).populate('user', 'name email profilePicture');

        // 3. For each order, we only want to show the items that belong to this seller
        // This makes it cleaner for the seller to see exactly what they need to fulfill
        const sellerOrders = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.items = orderObj.items.filter(item => productIds.includes(item.product.toString()));
            return orderObj;
        });

        res.json(sellerOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin/Seller
router.put('/:id', protect, sellerOrAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // If user is a seller, check if they own at least one product in this order
            if (req.user.role === 'seller') {
                const sellerProducts = await Product.find({ seller: req.user._id });
                const sellerProductIds = sellerProducts.map(p => p._id.toString());
                const hasProduct = order.items.some(item => sellerProductIds.includes(item.product.toString()));

                if (!hasProduct) {
                    return res.status(401).json({ message: 'Not authorized to update this order' });
                }
            }

            order.status = req.body.status || order.status;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            await order.deleteOne();
            res.json({ message: 'Order removed' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Owner, Admin, or Seller of items in order)
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            // Check if user is authorized to see this order
            // 1. User is the one who placed the order
            const isOwner = order.user._id.toString() === req.user._id.toString();
            
            // 2. User is an admin
            const isAdmin = req.user.role === 'admin';
            
            // 3. User is a seller who has items in this order
            let isSellerOfItems = false;
            if (req.user.role === 'seller') {
                const sellerProducts = await Product.find({ seller: req.user._id });
                const sellerProductIds = sellerProducts.map(p => p._id.toString());
                isSellerOfItems = order.items.some(item => sellerProductIds.includes(item.product.toString()));
            }

            if (!isOwner && !isAdmin && !isSellerOfItems) {
                return res.status(403).json({ message: 'You did not place this order. Only the owner can track it.' });
            }

            // Fallback for missing seller IDs in older orders
            const itemsWithSellers = await Promise.all(order.items.map(async (item) => {
                if (!item.seller && /^[0-9a-fA-F]{24}$/.test(item.product)) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        return { ...item.toObject(), seller: product.seller };
                    }
                }
                return item;
            }));

            const orderObj = order.toObject();
            orderObj.items = itemsWithSellers;

            res.json(orderObj);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
