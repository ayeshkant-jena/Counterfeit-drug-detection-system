//Batch.js
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  medicineName: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  bigCartonCount: { type: Number, required: true },
  bigBoxPerCarton: { type: Number, required: true },
  smallBoxPerBigBox: { type: Number, required: true },
  stripsPerSmallBox: { type: Number, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // supplyChainHistory records immutable first-time events (manufacturer -> wholesaler -> retailer -> consumer)
  supplyChainHistory: [
    {
      step: String, // e.g. 'manufactured', 'distributed', 'received', 'sold', 'scanned'
      role: String, // e.g. 'Manufacturer','Wholesaler','Retailer','Consumer'
      actorId: String, // user id or 'public'
      actorWallet: String,
      details: {}, // optional additional data (like bigBoxCount, distributionId)
      firstScannedAt: { type: Date } // set only once when first scanned at this step
    }
  ],
  // indicates whether the batch completed the full supply chain prior to customer
  supplyChainComplete: { type: Boolean, default: false },
  qrCodePath: { type: String },
  markedSent: { type: Boolean, default: false },
  blockchainHash: { type: String }
});

module.exports = mongoose.model('Batch', batchSchema);

