const mongoose = require('mongoose');
const LocationSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  name: { type: String, required: true }, // Nama Venue
  address: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 },
  benefit: { type: String, default: '' },
  mapLink: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Location', LocationSchema);