const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const Batch = require('../models/Batch');
const SupplyChainEvent = require('../models/SupplyChainEvent');
const Distribution = require('../models/Distribution');
const router = express.Router();

// Create new batch (Manufacturer only)
router.post('/create', requireAuth, async (req, res) => {
  try {
    // Verify manufacturer role
    if (req.user.role !== 'Manufacturer') {
      return res.status(403).json({ error: 'Only manufacturers can create batches' });
    }

    const {
      medicineName,
      description,
      expiryDate,
      totalCartons,
      boxesPerCarton,
      smallBoxesPerBox,
      stripsPerSmallBox,
      tabletsPerStrip
    } = req.body;

    // Validate required fields
    if (!medicineName || !expiryDate || !totalCartons || !boxesPerCarton || 
        !smallBoxesPerBox || !stripsPerSmallBox) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Create batch with unique ID
    const batchId = uuidv4();
    const batch = new Batch({
      batchId,
      medicineName,
      description,
      expiryDate,
      manufacturerId: req.user.id,
      manufacturerName: req.user.name,
      manufacturerWallet: req.user.walletAddress,
      totalCartons,
      boxesPerCarton,
      smallBoxesPerBox,
      stripsPerSmallBox,
      tabletsPerStrip: tabletsPerStrip || 10
    });

    await batch.save();

    // Record creation event
    const event = new SupplyChainEvent({
      eventId: uuidv4(),
      batchId,
      eventType: 'BATCH_CREATED',
      actor: {
        id: req.user.id,
        type: 'Manufacturer',
        name: req.user.name
      },
      quantity: {
        cartons: totalCartons,
        boxes: totalCartons * boxesPerCarton,
        smallBoxes: totalCartons * boxesPerCarton * smallBoxesPerBox,
        strips: totalCartons * boxesPerCarton * smallBoxesPerBox * stripsPerSmallBox,
        tablets: totalCartons * boxesPerCarton * smallBoxesPerBox * stripsPerSmallBox * (tabletsPerStrip || 10)
      }
    });

    await event.save();

    res.status(201).json({
      message: 'Batch created successfully',
      batch: {
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        verificationKey: batch.verificationKey,
        totalMedicineCount: batch.totalMedicineCount
      }
    });
  } catch (err) {
    console.error('Batch creation error:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// Get batch details (Public)
router.get('/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get supply chain events
    const events = await SupplyChainEvent.find({ batchId: batch.batchId })
      .sort({ timestamp: 1 });

    res.json({
      batch: {
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        manufacturerName: batch.manufacturerName,
        expiryDate: batch.expiryDate,
        status: batch.status,
        totalMedicineCount: batch.totalMedicineCount,
        remainingMedicineCount: batch.remainingMedicineCount
      },
      supplyChain: events
    });
  } catch (err) {
    console.error('Batch fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
});

// Get manufacturer's batches
router.get('/manufacturer/list', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Manufacturer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const batches = await Batch.find({ manufacturerId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(batches);
  } catch (err) {
    console.error('Batch list error:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Verify batch authenticity
router.post('/verify', async (req, res) => {
  try {
    const { batchId, verificationKey } = req.body;

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const isAuthentic = batch.verificationKey === verificationKey;
    
    // Record verification event if user is authenticated
    if (req.user) {
      const event = new SupplyChainEvent({
        eventId: uuidv4(),
        batchId,
        eventType: 'VERIFIED_BY_CONSUMER',
        actor: {
          id: req.user.id,
          type: req.user.role,
          name: req.user.name
        }
      });
      await event.save();
    }

    res.json({
      authentic: isAuthentic,
      message: isAuthentic ? 'Medicine is authentic' : 'Warning: Medicine might be counterfeit',
      batch: isAuthentic ? {
        medicineName: batch.medicineName,
        manufacturerName: batch.manufacturerName,
        expiryDate: batch.expiryDate,
        status: batch.status
      } : null
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;