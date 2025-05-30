const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.post('/save-qr', (req, res) => {
  const { image, batchId } = req.body;

  if (!image || !batchId) {
    return res.status(400).json({ error: 'Missing image or batchId' });
  }

  // Remove data URL prefix "data:image/png;base64,"
  const base64Data = image.replace(/^data:image\/png;base64,/, '');

  // Define file path to save QR image
  const filePath = path.join(__dirname, '..', 'public', 'qrcodes', `${batchId}.png`);

  // Make sure the directory exists
  fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
    if (err) return res.status(500).json({ error: 'Error creating directory' });

    // Write the image file
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save image' });

      return res.json({ message: 'QR code saved successfully' });
    });
  });
});

module.exports = router;
