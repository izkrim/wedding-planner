const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  wedding: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' }, // Family, Friend, Colleague
  side: { type: String, default: 'Both' }, // Bride, Groom, Both
  rsvp: { type: String, enum: ['Pending', 'Attending', 'Declined'], default: 'Pending' },
   pax: { type: Number, default: 1 },
  phone: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Guest', GuestSchema);