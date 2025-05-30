const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  medicineName: String,
  bigBoxCount: Number,
  smallBoxPerBigBox: Number,
  stripsPerSmallBox: Number,
  // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
