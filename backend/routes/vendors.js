const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const items = await Vendor.find({ wedding: req.query.weddingId });
  res.json(items);
});
router.post('/', auth, async (req, res) => {
  const item = new Vendor({ ...req.body, wedding: req.body.weddingId });
  await item.save();
  res.status(201).json(item);
});
router.put('/:id', auth, async (req, res) => {
  const item = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});
router.delete('/:id', auth, async (req, res) => {
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
module.exports = router;