const mongoose = require('mongoose');

const supplyChainEventSchema = new mongoose.Schema({
    batchId: { type: String, required: true },
    eventType: { 
        type: String, 
        enum: [
            'MANUFACTURED',
            'SHIPPED_TO_DISTRIBUTOR',
            'RECEIVED_BY_DISTRIBUTOR',
            'SHIPPED_TO_RETAILER',
            'RECEIVED_BY_RETAILER',
            'DISPENSED_TO_PATIENT'
        ],
        required: true 
    },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    performedBy: {
        userId: { type: String, required: true },
        role: { type: String, required: true },
        name: { type: String, required: true }
    },
    details: {
        temperature: Number,
        humidity: Number,
        transportMethod: String,
        vehicleId: String,
        notes: String
    },
    distributionId: { type: String },
    previousEventId: { type: mongoose.Schema.Types.ObjectId },
    blockchainHash: { type: String }
});

// Create compound index for efficient querying
supplyChainEventSchema.index({ batchId: 1, timestamp: 1 });

module.exports = mongoose.model('SupplyChainEvent', supplyChainEventSchema);