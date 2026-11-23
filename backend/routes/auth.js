const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Pastikan ini di-import
const auth = require('../middleware/auth');

const router = express.Router();

// Fungsi bantuan untuk membuat token
const generateToken = (userId, rememberMe) => {
  // Jika rememberMe true, token berlaku 30 hari. Jika false, 1 hari.
  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

// REGISTER
router.post('/register',
  body('name').trim().isLength({ min: 2 }).withMessage('Nama minimal 2 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password, rememberMe } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: 'Email sudah terdaftar' });

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id, rememberMe);

      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) { next(err); }
  }
);

// LOGIN
router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, rememberMe } = req.body;
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Email atau password salah' });
      }
      
      const token = generateToken(user._id, rememberMe);
      
      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) { next(err); }
  }
);

// GET current user
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;