const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const guests = await Guest.find({ wedding: req.query.weddingId });
    res.json(guests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const guest = new Guest({ ...req.body, wedding: req.body.weddingId });
    await guest.save();
    res.status(201).json(guest);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(guest);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guest deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;