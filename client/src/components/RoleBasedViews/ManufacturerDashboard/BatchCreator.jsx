import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode.react';

const BatchCreator = ({ userId }) => {
  const [batchData, setBatchData] = useState({
    batchId: '',
    productName: '',
    bigBoxes: 0,
    boxesPerBigBox: 0,
    stripsPerBox: 0,
  });

  const [generatedQR, setGeneratedQR] = useState(null);
  const qrRef = useRef();

  const handleChange = (e) => {
    setBatchData({ ...batchData, [e.target.name]: e.target.value });
  };

  const uploadQRToServer = async (qrBase64, batchId) => {
    try {
      const response = await fetch('/api/save-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: qrBase64, batchId }),
      });
      if (response.ok) {
        console.log('QR code saved successfully!');
      } else {
        console.error('Failed to save QR code');
      }
    } catch (err) {
      console.error('Error uploading QR:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const batchId = `BATCH-${Date.now()}`;
    const fullBatch = {
      ...batchData,
      batchId,
      manufacturerId: userId,
      timestamp: new Date().toISOString(),
    };

    // Generate QR data string
    const qrDataString = JSON.stringify(fullBatch);
    setGeneratedQR(qrDataString);

    setTimeout(() => {
      // Convert QRCode canvas to image base64
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const qrBase64 = canvas.toDataURL('image/png');
        uploadQRToServer(qrBase64, batchId);
      }
    }, 100); // small delay to ensure QRCode rendered

    // Reset form
    setBatchData({
      batchId: '',
      productName: '',
      bigBoxes: 0,
      boxesPerBigBox: 0,
      stripsPerBox: 0,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Inputs for productName, bigBoxes, boxesPerBigBox, stripsPerBox */}
        {/* ... */}
        <button type="submit">Create Batch</button>
      </form>

      {/* Hidden QR code for image generation */}
      <div style={{ position: 'absolute', left: '-9999px' }} ref={qrRef}>
        {generatedQR && <QRCode value={generatedQR} size={256} />}
      </div>

      {/* Visible QR code */}
      {generatedQR && (
        <div>
          <h3>QR Code:</h3>
          <QRCode value={generatedQR} size={256} />
        </div>
      )}
    </div>
  );
};

export default BatchCreator;
