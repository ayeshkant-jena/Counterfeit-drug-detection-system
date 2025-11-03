const mongoose = require('mongoose');

const wholesalerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wholesaler', wholesalerSchema);