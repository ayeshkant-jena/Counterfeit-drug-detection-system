//Batch.js
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  medicineName: String,
  bigBoxCount: Number,
  smallBoxPerBigBox: Number,
  stripsPerSmallBox: Number,
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  qrCodePath: { type: String },
  markedSent: { type: Boolean, default: false },
  blockchainHash: { type: String }
});

module.exports = mongoose.model('Batch', batchSchema);

