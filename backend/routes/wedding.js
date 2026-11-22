const express = require('express');
const Wedding = require('../models/Wedding');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// CREATE wedding
router.post('/', auth, async (req, res, next) => {
  try {
    const { coupleName, weddingDate } = req.body;
    const wedding = await Wedding.create({
      owner: req.user._id,
      coupleName,
      weddingDate
    });
    res.status(201).json(wedding);
  } catch (err) { next(err); }
});

// GET my wedding
router.get('/mine', auth, async (req, res, next) => {
  try {
    const wedding = await Wedding.findOne({
      $or: [
        { owner: req.user._id },
        { partner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).populate('owner partner collaborators', 'name email');
    res.json(wedding);
  } catch (err) { next(err); }
});

// JOIN via invite code (pasangan)
router.post('/join', auth, async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const wedding = await Wedding.findOne({ inviteCode });
    if (!wedding) return res.status(404).json({ error: 'Kode undangan tidak valid' });
    if (wedding.partner) return res.status(400).json({ error: 'Pasangan sudah terdaftar' });

    wedding.partner = req.user._id;
    await wedding.save();
    res.json({ message: 'Berhasil bergabung!', wedding });
  } catch (err) { next(err); }
});

module.exports = router;