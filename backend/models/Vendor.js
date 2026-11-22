const mongoose = require('mongoose');
const VendorSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  name: { type: String, required: true }, // Nama Vendor
  category: { type: String, default: 'Catering' }, // Catering, MUA, Foto, dll
  contact: { type: String, default: '' }, // Nama kontak / No HP
  estimatedCost: { type: Number, default: 0 },
  benefit: { type: String, default: '' },
  isBooked: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Vendor', VendorSchema);