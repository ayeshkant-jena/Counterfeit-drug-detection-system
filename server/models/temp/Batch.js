const mongoose = require('mongoose');
const crypto = require('crypto');

const batchSchema = new mongoose.Schema({
  // Basic Information
  batchId: { type: String, required: true, unique: true },
  medicineName: { type: String, required: true },
  description: String,
  
  // Manufacturer Information
  manufacturerId: { type: String, required: true },
  manufacturerName: { type: String, required: true },
  manufacturerWallet: { type: String },
  
  // Inventory Management
  totalCartons: { type: Number, required: true },
  boxesPerCarton: { type: Number, required: true },
  smallBoxesPerBox: { type: Number, required: true },
  stripsPerSmallBox: { type: Number, required: true },
  tabletsPerStrip: { type: Number, required: true, default: 10 },
  
  // Calculated Fields
  totalMedicineCount: { type: Number },
  remainingMedicineCount: { type: Number },
  
  // Current Status
  status: {
    type: String,
    enum: ['created', 'in-distribution', 'completed', 'expired', 'recalled'],
    default: 'created'
  },
  
  // Current Holder
  currentHolder: {
    holderId: { type: String },
    holderType: { 
      type: String, 
      enum: ['Manufacturer', 'Wholesaler', 'Retailer']
    },
    holderName: { type: String }
  },
  
  // Verification and Security
  verificationKey: { type: String },
  blockchainHash: { type: String },
  qrCodePath: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  expiryDate: { type: Date, required: true }
});

// Middleware to calculate medicine count and generate verification key
batchSchema.pre('save', function(next) {
  // Calculate total medicine count if not set
  if (!this.totalMedicineCount) {
    this.totalMedicineCount = 
      this.totalCartons * 
      this.boxesPerCarton * 
      this.smallBoxesPerBox * 
      this.stripsPerSmallBox * 
      this.tabletsPerStrip;
    
    this.remainingMedicineCount = this.totalMedicineCount;
  }

  // Generate verification key if not set
  if (!this.verificationKey) {
    const data = `${this.batchId}${this.medicineName}${this.manufacturerId}${Date.now()}`;
    this.verificationKey = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Update timestamps
  this.updatedAt = new Date();
  
  next();
});

// Method to check if medicine count is available
batchSchema.methods.hasMedicineAvailable = function(count) {
  return this.remainingMedicineCount >= count;
};

// Method to deduct medicine count
batchSchema.methods.deductMedicine = function(count) {
  if (this.remainingMedicineCount < count) {
    throw new Error('Insufficient medicine quantity');
  }
  this.remainingMedicineCount -= count;
  return this.remainingMedicineCount;
};

module.exports = mongoose.model('Batch', batchSchema);