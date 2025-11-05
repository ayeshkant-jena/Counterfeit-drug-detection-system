const mongoose = require('mongoose');

const supplyChainEventSchema = new mongoose.Schema({
  // Basic Information
  eventId: { type: String, required: true, unique: true },
  batchId: { type: String, required: true },
  distributionId: { type: String },
  
  // Event Type
  eventType: {
    type: String,
    enum: [
      'BATCH_CREATED',
      'DISTRIBUTION_INITIATED',
      'SHIPPED_TO_WHOLESALER',
      'RECEIVED_BY_WHOLESALER',
      'SHIPPED_TO_RETAILER',
      'RECEIVED_BY_RETAILER',
      'DISPENSED_TO_CONSUMER',
      'VERIFIED_BY_CONSUMER',
      'REJECTED',
      'RECALLED'
    ],
    required: true
  },
  
  // Actor Information
  actor: {
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['Manufacturer', 'Wholesaler', 'Retailer', 'Consumer', 'System'],
      required: true 
    },
    name: { type: String, required: true }
  },
  
  // Location Information
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Quantity Information
  quantity: {
    cartons: Number,
    boxes: Number,
    smallBoxes: Number,
    strips: Number,
    tablets: Number
  },
  
  // Environmental Data
  environment: {
    temperature: Number,
    humidity: Number,
    timestamp: Date
  },
  
  // Verification Data
  verification: {
    verificationKey: String,
    blockchainHash: String,
    signature: String
  },
  
  // Additional Data
  metadata: {
    deviceId: String,
    transactionHash: String,
    notes: String
  },
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
  recordedAt: { type: Date, default: Date.now }
});

// Create indexes for efficient querying
supplyChainEventSchema.index({ batchId: 1, timestamp: 1 });
supplyChainEventSchema.index({ distributionId: 1, timestamp: 1 });
supplyChainEventSchema.index({ 'actor.id': 1, timestamp: 1 });

module.exports = mongoose.model('SupplyChainEvent', supplyChainEventSchema);