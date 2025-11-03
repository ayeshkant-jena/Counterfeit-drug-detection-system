const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true },
  entityType: { type: String, enum: ['Batch', 'Distribution'], required: true },
  entityId: { type: String, required: true }, // batchId or distributionId
  role: { type: String }, // role of the scanner if known, else 'Consumer' or 'Public'
  actorId: { type: String }, // user id or 'public'
  actorWallet: { type: String },
  qrPayload: {},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scan', scanSchema);
