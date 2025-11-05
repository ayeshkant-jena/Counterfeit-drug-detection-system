const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const Distribution = require('../models/Distribution');
const Batch = require('../models/Batch');
const SupplyChainEvent = require('../models/SupplyChainEvent');
const router = express.Router();

// Initiate distribution
router.post('/initiate', requireAuth, async (req, res) => {
  try {
    if (!['Manufacturer', 'Wholesaler'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to initiate distribution' });
    }

    const {
      batchId,
      destinationId,
      quantity,
      shippingDetails
    } = req.body;

    // Validate batch
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Verify ownership
    if (req.user.role === 'Manufacturer' && batch.manufacturerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to distribute this batch' });
    }
    if (req.user.role === 'Wholesaler' && batch.currentHolder.holderId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to distribute this batch' });
    }

    // Verify quantity
    const totalTablets = 
      quantity.cartons * 
      batch.boxesPerCarton * 
      batch.smallBoxesPerBox * 
      batch.stripsPerSmallBox * 
      batch.tabletsPerStrip;

    if (totalTablets > batch.remainingMedicineCount) {
      return res.status(400).json({ error: 'Insufficient medicine quantity' });
    }

    // Create distribution
    const distribution = new Distribution({
      distributionId: uuidv4(),
      batchId,
      sourceId: req.user.id,
      sourceType: req.user.role,
      sourceName: req.user.name,
      destinationId,
      destinationType: req.user.role === 'Manufacturer' ? 'Wholesaler' : 'Retailer',
      quantity,
      shipping: shippingDetails
    });

    await distribution.save();

    // Update batch
    batch.remainingMedicineCount -= totalTablets;
    batch.status = 'in-distribution';
    await batch.save();

    // Record event
    const event = new SupplyChainEvent({
      eventId: uuidv4(),
      batchId,
      distributionId: distribution.distributionId,
      eventType: req.user.role === 'Manufacturer' ? 'SHIPPED_TO_WHOLESALER' : 'SHIPPED_TO_RETAILER',
      actor: {
        id: req.user.id,
        type: req.user.role,
        name: req.user.name
      },
      quantity,
      environment: {
        temperature: shippingDetails?.temperature,
        humidity: shippingDetails?.humidity,
        timestamp: new Date()
      }
    });

    await event.save();

    res.status(201).json({
      message: 'Distribution initiated successfully',
      distributionId: distribution.distributionId,
      verificationCode: distribution.verificationCode
    });
  } catch (err) {
    console.error('Distribution initiation error:', err);
    res.status(500).json({ error: 'Failed to initiate distribution' });
  }
});

// Verify and receive distribution
router.post('/verify', requireAuth, async (req, res) => {
  try {
    if (!['Wholesaler', 'Retailer'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to verify distributions' });
    }

    const { distributionId, verificationCode } = req.body;

    // Find distribution
    const distribution = await Distribution.findOne({ distributionId });
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Verify recipient
    if (distribution.destinationId !== req.user.id) {
      return res.status(403).json({ error: 'Not the intended recipient' });
    }

    // Verify code
    if (distribution.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update distribution
    distribution.status = 'verified';
    distribution.verifiedAt = new Date();
    await distribution.save();

    // Update batch
    const batch = await Batch.findOne({ batchId: distribution.batchId });
    batch.currentHolder = {
      holderId: req.user.id,
      holderType: req.user.role,
      holderName: req.user.name
    };
    await batch.save();

    // Record event
    const event = new SupplyChainEvent({
      eventId: uuidv4(),
      batchId: distribution.batchId,
      distributionId,
      eventType: req.user.role === 'Wholesaler' ? 'RECEIVED_BY_WHOLESALER' : 'RECEIVED_BY_RETAILER',
      actor: {
        id: req.user.id,
        type: req.user.role,
        name: req.user.name
      },
      quantity: distribution.quantity
    });

    await event.save();

    res.json({
      message: 'Distribution verified successfully',
      distribution: {
        batchId: distribution.batchId,
        quantity: distribution.quantity,
        status: distribution.status
      }
    });
  } catch (err) {
    console.error('Distribution verification error:', err);
    res.status(500).json({ error: 'Failed to verify distribution' });
  }
});

// Get distributions list
router.get('/list', requireAuth, async (req, res) => {
  try {
    const query = req.user.role === 'Manufacturer' 
      ? { sourceId: req.user.id }
      : { destinationId: req.user.id };

    const distributions = await Distribution.find(query)
      .sort({ createdAt: -1 });

    res.json(distributions);
  } catch (err) {
    console.error('Distribution list error:', err);
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

module.exports = router;