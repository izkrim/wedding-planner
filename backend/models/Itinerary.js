const mongoose = require('mongoose');
const ItinerarySchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  time: { type: String, required: true },
  title: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Itinerary', ItinerarySchema);