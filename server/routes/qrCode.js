const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Batch = require('../models/Batch');

const router = express.Router();

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
  const { batchId } = req.body;

  if (!batchId) {
    return res.status(400).json({ message: 'Missing batchId' });
  }

  try {
    const batch = await Batch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (batch.sent) {
      return res.status(400).json({ message: 'Batch already marked as sent' });
    }

    batch.sent = true;
    batch.sentAt = new Date();
    await batch.save();

    const txHash = "dummy_blockchain_hash"; // Replace with real blockchain hash later
    res.json({ message: 'Batch marked as sent', hash: txHash });
  } catch (err) {
    console.error('QR scan error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
