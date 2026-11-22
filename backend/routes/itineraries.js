const express = require('express');
const router = express.Router();
const Itinerary = require('../models/Itinerary');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const items = await Itinerary.find({ wedding: req.query.weddingId }).sort({ time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const item = new Itinerary({ ...req.body, wedding: req.body.weddingId });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Itinerary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Itinerary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;