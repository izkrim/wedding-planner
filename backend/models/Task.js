const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  title: { type: String, required: true },
  dueDate: { type: String, default: '' }, // Kita ubah jadi String agar tidak error format tanggal
  icon: { type: String, default: 'fa-solid fa-ring' }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);