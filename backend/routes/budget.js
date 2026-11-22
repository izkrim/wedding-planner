const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

// Ambil semua budget
router.get('/', auth, async (req, res) => {
  try {
    const items = await Budget.find({ wedding: req.query.weddingId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tambah budget baru
router.post('/', auth, async (req, res) => {
  try {
    const item = new Budget({ ...req.body, wedding: req.body.weddingId });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Edit / Update budget (termasuk realisasi biaya)
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Hapus budget
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Budget item deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;