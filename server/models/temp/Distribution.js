const mongoose = require('mongoose');
const crypto = require('crypto');

const distributionSchema = new mongoose.Schema({
  // Basic Information
  distributionId: { type: String, required: true, unique: true },
  batchId: { type: String, required: true },
  
  // Source Information
  sourceId: { type: String, required: true },
  sourceType: { 
    type: String, 
    enum: ['Manufacturer', 'Wholesaler'],
    required: true 
  },
  sourceName: { type: String, required: true },
  
  // Destination Information
  destinationId: { type: String, required: true },
  destinationType: { 
    type: String, 
    enum: ['Wholesaler', 'Retailer'],
    required: true 
  },
  destinationName: { type: String, required: true },
  
  // Quantity Information
  quantity: {
    cartons: { type: Number, required: true },
    boxes: { type: Number, required: true },
    smallBoxes: { type: Number, required: true },
    strips: { type: Number, required: true },
    tablets: { type: Number, required: true }
  },
  
  // Status Information
  status: {
    type: String,
    enum: ['created', 'shipped', 'in-transit', 'delivered', 'verified', 'rejected'],
    default: 'created'
  },
  
  // Shipping Information
  shipping: {
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    temperature: Number,
    humidity: Number
  },
  
  // Verification
  verificationCode: { type: String },
  qrCodePath: { type: String },
  blockchainHash: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  shippedAt: Date,
  deliveredAt: Date,
  verifiedAt: Date,
  
  // Notes and Additional Information
  notes: String,
  rejectionReason: String
});

// Generate verification code before saving
distributionSchema.pre('save', function(next) {
  if (!this.verificationCode) {
    const data = `${this.distributionId}${this.batchId}${this.sourceId}${this.destinationId}${Date.now()}`;
    this.verificationCode = crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
  next();
});

// Method to update status with timestamp
distributionSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'verified':
      this.verifiedAt = new Date();
      break;
  }
};

module.exports = mongoose.model('Distribution', distributionSchema);