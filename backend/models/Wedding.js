const mongoose = require('mongoose');

const WeddingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // pasangan
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // WO/keluarga
  coupleName: { type: String, required: true }, // "Anugrah & Hana"
  weddingDate: { type: Date, required: true },
  venue: { type: String, default: '' },
  budgetTotal: { type: Number, default: 0 },
  inviteCode: { type: String, unique: true }, // untuk invite pasangan
  createdAt: { type: Date, default: Date.now }
});

// Generate invite code otomatis
WeddingSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Wedding', WeddingSchema);