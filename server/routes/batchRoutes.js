// ...existing code...
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Batch = require('../models/Batch');
const User = require('../models/User');
const router = express.Router();

// Create a new batch (requires manufacturer authentication)
router.post('/create', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    // Ensure authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only manufacturers can create batches
    if (req.user.role !== 'Manufacturer') {
      return res.status(403).json({ error: 'Only manufacturers can create batches' });
    }

    // Accept client payload and map to schema fields
    const {
      medicineName,
      manufacturer,
      batchNumber,
      manufacturingDate,
      expiryDate,
      totalCartons,
      boxesPerCarton,
      smallBoxesPerBox,
      stripsPerSmallBox,
      tabletsPerStrip,
      status
    } = req.body;

    // Log incoming request for easier debugging
    console.log('Create batch request by user:', { userId: req.user.id, role: req.user.role });
    console.log('Request body:', req.body);

    // Use provided batchNumber as batchId when available (keeps QR reference stable), else generate
    const batchId = batchNumber || uuidv4();

    // manufacturerId from authenticated user
    const manufacturerId = req.user.id;

    // Generate verification key for batch security
    const verificationKeyData = `${batchId}${medicineName}${manufacturerId}${Date.now()}`;
    const verificationKey = require('crypto')
      .createHash('sha256')
      .update(verificationKeyData)
      .digest('hex')
      .substring(0, 16);

    const newBatch = new Batch({
      batchId,
      medicineName,
      manufacturer: manufacturer || req.user.name || 'Unknown Manufacturer',
      manufacturerId,
      // Backwards-compatible fields used by older UI components
      createdBy: manufacturerId,
      bigCartonCount: Number(totalCartons) || 0,
      bigBoxPerCarton: Number(boxesPerCarton) || 0,
      smallBoxPerBigBox: Number(smallBoxesPerBox) || 0,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      totalCartons: Number(totalCartons) || 0,
      boxesPerCarton: Number(boxesPerCarton) || 0,
      smallBoxesPerBox: Number(smallBoxesPerBox) || 0,
      stripsPerSmallBox: Number(stripsPerSmallBox) || 0,
      tabletsPerStrip: Number(tabletsPerStrip) || 0,
      status: status || 'created',
      verificationKey
    });

    // Log the batch object to be saved for debugging
    console.log('Saving newBatch (preview):', newBatch.toObject ? newBatch.toObject() : newBatch);

    await newBatch.save();
    res.status(201).json({ message: 'Batch created', batchId, blockchainHash: newBatch.blockchainHash });
  } catch (err) {
    console.error('Batch creation error:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      user: req.user
    });

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid batch data',
        details: Object.values(err.errors).map(e => e.message)
      });
    }

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
    const userId = req.params.userId.trim();
    console.log("📥 Fetching batches for user:", userId);

    // Match either createdBy or manufacturerId field
    const batches = await Batch.find({
      $or: [
        { createdBy: userId },
        { manufacturerId: userId }
      ]
    }).lean();

    console.log(`📦 Found ${batches.length} batches`);
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

// Debug: get batch details (including createdBy) - useful during troubleshooting
router.get('/details/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId }).lean();
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    // return createdBy and other internal fields for debugging
    res.json({ batchId: batch.batchId, createdBy: batch.createdBy, createdAt: batch.createdAt, medicineName: batch.medicineName });
  } catch (err) {
    console.error('Error fetching batch details:', err);
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
});

module.exports = router;
