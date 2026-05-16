const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Message = require('./models/Message');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeder'))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Message.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('123456', salt);

        const createdUsers = await User.insertMany([
            {
                name: 'Admin User',
                email: 'zaheerastorian@gmail.com',
                password: adminPassword,
                role: 'admin',
            },
            {
                name: 'John Doe',
                email: 'user@example.com',
                password: adminPassword, // same password for simplicity
                role: 'user',
            },
        ]);

        const adminUser = createdUsers[0]._id;

        const sampleProducts = [
            {
                user: adminUser,
                name: 'Airpods Wireless Bluetooth Headphones',
                image: 'https://images.unsplash.com/photo-1572569028029-fa8713a3f521?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                description:
                    'Bluetooth technology lets you connect it with compatible devices wirelessly High-quality AAC audio offers immersive listening experience Built-in microphone allows you to take calls while working',
                category: 'Electronics',
                price: 89.99,
                stock: 10,
            },
            {
                user: adminUser,
                name: 'iPhone 13 Pro 256GB Memory',
                image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2535&q=80',
                description:
                    'Introducing the iPhone 13 Pro. A transformative triple-camera system that adds tons of capability without complexity. An unprecedented leap in battery life',
                category: 'Electronics',
                price: 599.99,
                stock: 7,
            },
            {
                user: adminUser,
                name: 'Cannon EOS 80D DSLR Camera',
                image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1638&q=80',
                description:
                    'Characterized by versatile imaging specs, the Canon EOS 80D further clarifies itself using a pair of robust focusing systems and an intuitive design',
                category: 'Electronics',
                price: 929.99,
                stock: 5,
            },
            {
                user: adminUser,
                name: 'Sony Playstation 5',
                image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
                description:
                    'The ultimate home entertainment center. Starts with PlayStation. Whether you are into gaming, HD movies, television, music',
                category: 'Electronics',
                price: 399.99,
                stock: 11,
            },
        ];

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
