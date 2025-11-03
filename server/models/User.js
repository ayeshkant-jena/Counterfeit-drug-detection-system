const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String, // Hashed
    role: { type: String, enum: ['Manufacturer', 'Wholesaler', 'Retailer'], required: true },
    walletAddress: String,
    licenseNumber: String,
    companyAddress: String,
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
