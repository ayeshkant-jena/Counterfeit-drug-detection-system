const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
    distributionId: { type: String, required: true, unique: true },
    batchId: { type: String, required: true },
    medicineName: { type: String, required: true },
    manufacturerId: { type: String },
    // who is sending in this distribution (could be Manufacturer or Wholesaler)
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['Manufacturer','Wholesaler','Retailer'], required: true },
    // who is intended to receive in this distribution (Wholesaler or Retailer)
    receiverId: { type: String, required: true },
    receiverRole: { type: String, enum: ['Wholesaler','Retailer'], required: true },
    bigBoxCount: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    qrCodePath: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'in-transit', 'delivered'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now },
    blockchainHash: { type: String }
});

module.exports = mongoose.model('Distribution', distributionSchema);