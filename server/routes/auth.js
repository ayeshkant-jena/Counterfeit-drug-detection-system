const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'yoursecretkey';

// Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, walletAddress, licenseNumber, companyAddress } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, phone, password: hashedPassword, role, walletAddress, licenseNumber, companyAddress });

  try {
    await newUser.save();
    res.status(201).json({ message: 'Registered successfully. Await admin approval.' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists or invalid data.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.isApproved) return res.status(403).json({ error: 'Account pending admin approval' });

  const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });

  res.json({ token, role: user.role, name: user.name });
});


module.exports = router;
