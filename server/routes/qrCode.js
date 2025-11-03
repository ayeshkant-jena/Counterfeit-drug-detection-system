const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Batch = require('../models/Batch');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// populate req.user when Authorization header provided; allow anonymous otherwise
router.use(requireAuth);

// Save QR Code Image and update batch
router.post('/qrcodes', async (req, res) => {
  const { image, batchId } = req.body;

  if (!image || !batchId) {
    return res.status(400).json({ error: 'Missing image or batchId' });
  }

  try {
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const fileName = `${batchId}.png`;
    const dirPath = path.join(__dirname, '..', 'public', 'qrcodes');
    const filePath = path.join(dirPath, fileName);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, base64Data, 'base64');

    await Batch.findOneAndUpdate(
      { batchId },
      { qrCodePath: `/qrcodes/${fileName}` }
    );

    res.json({ message: 'QR saved and path updated' });
  } catch (err) {
    console.error('Save QR Error:', err);
    res.status(500).json({ error: 'Error saving QR or updating batch' });
  }
});

// Scan QR Code to mark batch as sent
router.post('/scan-qr', async (req, res) => {
  // Accept either { qr } (full JSON string or object) or { batchId } for legacy
  const { qr, batchId } = req.body;

  let payload = null;
  if (qr) {
    try {
      payload = typeof qr === 'string' ? JSON.parse(qr) : qr;
    } catch (err) {
      return res.status(400).json({ message: 'Invalid QR payload' });
    }
  } else if (batchId) {
    payload = { batchId };
  } else {
    return res.status(400).json({ message: 'Missing qr or batchId' });
  }

  try {
    // determine if this is a distribution or batch QR
    const ScanModel = require('../models/Scan');
    const { distributionId, batchId: bId, medicineName } = payload;
    const entityType = distributionId ? 'Distribution' : 'Batch';
    const entityId = distributionId || bId;

    if (!entityId) {
      return res.status(400).json({ message: 'QR does not contain batch or distribution id' });
    }

    // find corresponding record
    let entity = null;
    if (entityType === 'Distribution') {
      const Distribution = require('../models/Distribution');
      entity = await Distribution.findOne({ distributionId: entityId });
      if (!entity) {
        return res.status(404).json({ message: 'Distribution not found' });
      }
    } else {
      entity = await Batch.findOne({ batchId: entityId });
      if (!entity) {
        return res.status(404).json({ message: 'Batch not found' });
      }
    }

    // actor details - if request includes authenticated user middleware it could set req.user
    const actorId = req.user?.id || 'public';
    const actorRole = req.user?.role || 'Consumer';

    // create a scan log (always)
    const { v4: uuidv4 } = require('uuid');
    const scanRecord = new ScanModel({
      scanId: uuidv4(),
      entityType,
      entityId,
      role: actorRole,
      actorId,
      actorWallet: req.user?.walletAddress,
      qrPayload: payload
    });
    await scanRecord.save();

    // Check and append immutable first-scan entry into batch.supplyChainHistory
    // For distribution scans, update the parent batch
    const targetBatchId = entityType === 'Distribution' ? entity.batchId : entity.batchId;
    const batch = await Batch.findOne({ batchId: targetBatchId });
    if (!batch) {
      return res.status(404).json({ message: 'Parent batch not found' });
    }

    // Decide step name based on role (simple mapping)
    const stepName = actorRole === 'Manufacturer' ? 'manufactured' : actorRole === 'Wholesaler' ? 'distributed' : actorRole === 'Retailer' ? 'received' : 'scanned';

    // Check if there's already a firstScannedAt for this role+details
    const existing = batch.supplyChainHistory && batch.supplyChainHistory.find(h => h.role === actorRole && JSON.stringify(h.details || {}) === JSON.stringify(payload.details || {}));

    if (!existing) {
      // push immutable first-scan entry
      const entry = {
        step: stepName,
        role: actorRole,
        actorId,
        actorWallet: req.user?.walletAddress,
        details: payload,
        firstScannedAt: new Date()
      };
      batch.supplyChainHistory = batch.supplyChainHistory || [];
      batch.supplyChainHistory.push(entry);

      // after pushing, evaluate if supply chain is complete (manufacturer -> wholesaler -> retailer present)
      const rolesSeen = batch.supplyChainHistory.map(h => h.role);
      const required = ['Manufacturer', 'Wholesaler', 'Retailer'];
      const complete = required.every(r => rolesSeen.includes(r));
      batch.supplyChainComplete = complete;

      await batch.save();
    }

    // If consumer scan (public), return whether batch is authentic
    if (actorRole === 'Consumer' || actorId === 'public') {
      const isAuthentic = !!batch.supplyChainComplete;
      return res.json({ message: isAuthentic ? 'Authentic' : 'Suspected Fake', authentic: isAuthentic, batch: {
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        expiryDate: batch.expiryDate,
        supplyChainHistory: batch.supplyChainHistory
      }});
    }

    // otherwise return generic success
    res.json({ message: 'Scan recorded', batchId: batch.batchId, supplyChainComplete: batch.supplyChainComplete });
  } catch (err) {
    console.error('QR scan error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
