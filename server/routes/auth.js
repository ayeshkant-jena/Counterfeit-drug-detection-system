const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'yoursecretkey';

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      walletAddress,
      licenseNumber,
      companyAddress
    } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Check if wallet already exists
    const existingWallet = await User.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet address already registered. Please use a different wallet.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      walletAddress,
      licenseNumber,
      companyAddress
    });

    await newUser.save();
    res.status(201).json({ message: 'Registered successfully. Await admin approval.' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Check admin approval
    if (!user.isApproved) {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, name: user.name, id: user._id, walletAddress: user.walletAddress });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

router.get('/check-wallet', async (req, res) => {
  try {
    const wallet = req.query.wallet?.toLowerCase();
    if (!wallet) return res.status(400).json({ error: 'Wallet address is required' });

    const exists = await User.exists({ walletAddress: wallet });
    res.json({ exists: !!exists });

  } catch (err) {
    console.error('Check wallet error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
