const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  
  // Role Information
  role: { 
    type: String, 
    enum: ['Manufacturer', 'Wholesaler', 'Retailer', 'Admin'],
    required: true 
  },
  
  // Organization Details
  organization: {
    name: { type: String, required: true },
    address: String,
    license: String,
    phone: String
  },
  
  // Blockchain Wallet
  walletAddress: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to verify password
userSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to check if user can distribute medicine
userSchema.methods.canDistribute = function() {
  return ['Manufacturer', 'Wholesaler'].includes(this.role);
};

// Method to check if user can receive medicine
userSchema.methods.canReceive = function() {
  return ['Wholesaler', 'Retailer'].includes(this.role);
};

module.exports = mongoose.model('User', userSchema);