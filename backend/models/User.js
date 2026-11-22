const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['bride', 'groom', 'planner'], default: 'bride' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password sebelum save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);