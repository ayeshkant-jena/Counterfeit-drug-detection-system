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
    res.status(500).json({ error: 'Batch creation failed' });
  }
});

module.exports = router;
