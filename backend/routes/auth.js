const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Check if user exists
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'manager' } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    if (password.length < 3) {
      return res.status(400).json({ message: 'Password must be at least 3 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate role
    if (!['admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin or manager' });
    }

    // Create new user
    const newUser = new User({
      username,
      password,
      role
    });

    await newUser.save();

    // Create JWT token
    const payload = {
      userId: newUser._id,
      username: newUser.username,
      role: newUser.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/init
// @desc    Initialize admin user (development only)
// @access  Public
router.post('/init', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Create admin user with hardcoded password "123"
    const adminUser = new User({
      username: 'admin',
      password: '123',
      role: 'admin'
    });

    await adminUser.save();

    res.json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
