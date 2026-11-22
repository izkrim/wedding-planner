const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  item: { type: String, required: true }, // Nama Pengeluaran
  estimatedCost: { type: Number, required: true }, // Rencana Biaya
  actualCost: { type: Number, default: 0 }, // Uang yang sudah keluar
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);