// ...existing code...
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Batch = require('../models/Batch');
const User = require('../models/User');
const router = express.Router();

// Create a new batch
router.post('/create', async (req, res) => {
  let { 
    medicineName, 
    expiryDate,
    bigCartonCount,
    bigBoxPerCarton,
    smallBoxPerBigBox,
    stripsPerSmallBox,
    createdBy 
  } = req.body;
  const batchId = uuidv4();

  try {
    // prefer authenticated user id if available (req.user set by auth middleware)
    if (req.user && req.user.id) {
      createdBy = req.user.id;
    }
    const newBatch = new Batch({
      batchId,
      medicineName,
      expiryDate,
      bigCartonCount,
      bigBoxPerCarton,
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
    const param = req.params.userId;
    // if param looks like a wallet address, try resolving to a user id
    let userIdResolved = null;
    if (typeof param === 'string' && param.toLowerCase().startsWith('0x')) {
      const user = await User.findOne({ walletAddress: param.toLowerCase() }).lean();
      if (user) userIdResolved = user._id.toString();
    }

    const query = userIdResolved ? { $or: [{ createdBy: param }, { createdBy: userIdResolved }] } : { createdBy: param };
    const batches = await Batch.find(query);
    res.json(batches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Verify batch exists
router.post('/verify', async (req, res) => {
  try {
    const { batchId } = req.body;
    const batch = await Batch.findOne({ batchId });
    
    if (!batch) {
      return res.status(404).json({ 
        status: 'not_found',
        message: 'Batch not found' 
      });
    }

    res.json({ 
      status: 'found',
      message: 'Batch found',
      batch: {
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        expiryDate: batch.expiryDate,
        bigCartonCount: batch.bigCartonCount,
        bigBoxPerCarton: batch.bigBoxPerCarton,
        smallBoxPerBigBox: batch.smallBoxPerBigBox,
        stripsPerSmallBox: batch.stripsPerSmallBox,
        createdAt: batch.createdAt,
        blockchainHash: batch.blockchainHash
      }
    });
  } catch (err) {
    console.error("Error verifying batch:", err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to verify batch' 
    });
  }
});

module.exports = router;
