const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const items = await Location.find({ wedding: req.query.weddingId });
  res.json(items);
});
router.post('/', auth, async (req, res) => {
  const item = new Location({ ...req.body, wedding: req.body.weddingId });
  await item.save();
  res.status(201).json(item);
});
router.put('/:id', auth, async (req, res) => {
  const item = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});
router.delete('/:id', auth, async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
module.exports = router;