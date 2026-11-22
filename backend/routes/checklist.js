const express = require('express');
const router = express.Router();
const Checklist = require('../models/Checklist');
const auth = require('../middleware/auth');

// 1. Ambil semua data checklist
router.get('/', auth, async (req, res) => {
  try {
    const items = await Checklist.find({ wedding: req.query.weddingId }).sort({ isCompleted: 1, createdAt: -1 });
    res.json(items);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// 2. Tambah tugas baru (POST)
router.post('/', auth, async (req, res) => {
  try {
    const item = new Checklist({ 
      task: req.body.task,
      wedding: req.body.weddingId,
      isCompleted: false
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// 3. Edit Tugas & Centang (PUT)
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Checklist.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(item);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
});

// 4. Hapus tugas (DELETE)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Checklist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Checklist deleted' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;