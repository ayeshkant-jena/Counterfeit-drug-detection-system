//qrcode.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Batch = require('../models/Batch');

const router = express.Router();

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

    await fs.mkdir(dirPath, { recursive: true });      // create folder if not exists
    await fs.writeFile(filePath, base64Data, 'base64'); // save QR image

    // update batch with QR code path
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

module.exports = router;

