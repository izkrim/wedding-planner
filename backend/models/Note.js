const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Note', NoteSchema);