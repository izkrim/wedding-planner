const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// 1. Ambil SEMUA data agenda
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ wedding: req.query.weddingId }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Ambil SATU data agenda berdasarkan ID (Untuk fitur Edit)
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Agenda tidak ditemukan' });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Tambah agenda baru
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, wedding: req.body.weddingId });
    await task.save();
    res.status(201).json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 4. Edit agenda
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, wedding, ...updateData } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!task) return res.status(404).json({ error: 'Agenda tidak ditemukan' });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 5. Hapus agenda
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Agenda dihapus' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;