// /backend/routes/batchRoutes.js
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
