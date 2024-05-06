// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret';

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/admin_panel', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Models
const User = mongoose.model('User', {
    username: String,
    email: String,
    password: String,
    role: { type: String, default: 'user' } // Admin role can be 'admin'
});

const MongoDBInstance = mongoose.model('MongoDBInstance', {
    name: String,
    host: String,
    port: Number,
    databases: [{
        name: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
});

// Middleware
app.use(bodyParser.json());

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Authorization token required' });
    }
};

// Routes
// Signup
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    try {
        if (await bcrypt.compare(password, user.password)) {
            const accessToken = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET);
            res.json({ accessToken });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Change User's Password
app.patch('/users/:id/password', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(id, { password: hashedPassword });
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Remove User
app.delete('/users/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove Database
app.delete('/databases/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        await Database.findByIdAndDelete(id);
        res.json({ message: 'Database deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove Access of User from Database
app.patch('/databases/:databaseId/removeUser/:userId', authenticateJWT, async (req, res) => {
    const { databaseId, userId } = req.params;
    try {
        const database = await Database.findById(databaseId);
        database.users.pull(userId);
        await database.save();
        res.json({ message: 'User access revoked successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Assign New User to Database
app.post('/databases/:databaseId/addUser', authenticateJWT, async (req, res) => {
    const { databaseId } = req.params;
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const database = await Database.findById(databaseId);
        database.users.push(user._id);
        await database.save();
        res.json({ message: 'User assigned to database successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
