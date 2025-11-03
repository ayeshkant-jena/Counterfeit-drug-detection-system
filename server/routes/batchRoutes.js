// ...existing code...
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Batch = require('../models/Batch');
const router = express.Router();

// Create a new batch
router.post('/create', async (req, res) => {
  const { medicineName, bigBoxCount, smallBoxPerBigBox, stripsPerSmallBox, createdBy } = req.body;
  const batchId = uuidv4();

  try {
    const newBatch = new Batch({
      batchId,
      medicineName,
      bigBoxCount,
      smallBoxPerBigBox,
      stripsPerSmallBox,
      createdBy
    });

    await newBatch.save();
    res.status(201).json({ message: 'Batch created', batchId });
  } catch (err) {
    console.error('Batch creation error:', err);
    res.status(500).json({ error: 'Batch creation failed', details: err.message });
  }
});

// GET total batches count
router.get('/count', async (req, res) => {
  try {
    const count = await Batch.countDocuments({});
    res.json({ count });
  } catch (err) {
    console.error('Error getting total batch count:', err);
    res.status(500).json({ error: 'Failed to get batch count' });
  }
});

// GET batches count for a specific user
router.get('/count/by-user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await Batch.countDocuments({ createdBy: userId });
    res.json({ count });
  } catch (err) {
    console.error('Error getting user batch count:', err);
    res.status(500).json({ error: 'Failed to get user batch count' });
  }
});

// GET batches by user id
router.get('/by-user/:userId', async (req, res) => {
  try {
    const batches = await Batch.find({ createdBy: req.params.userId });
    res.json(batches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

module.exports = router;
