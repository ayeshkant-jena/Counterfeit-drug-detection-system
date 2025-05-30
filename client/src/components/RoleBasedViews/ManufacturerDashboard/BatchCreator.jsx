import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import './ManufacturerView.css';

const BatchCreator = ({ userId }) => {
  const [form, setForm] = useState({
    medicineName: '',
    bigBoxCount: '',
    smallBoxPerBigBox: '',
    stripsPerSmallBox: ''
  });

  const [qrImage, setQrImage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Step 1: Create Batch
    const batchRes = await axios.post('http://localhost:5000/api/batches/create', {
      ...form,
      createdBy: userId
    });

    const batchId = batchRes.data.batchId;

    // Step 2: Generate QR Code
    const qrData = {
      batchId,
      medicineName: form.medicineName,
      bigBoxCount: form.bigBoxCount,
      smallBoxPerBigBox: form.smallBoxPerBigBox,
      stripsPerSmallBox: form.stripsPerSmallBox
    };
    const qrString = JSON.stringify(qrData);
    const qrImageUrl = await QRCode.toDataURL(qrString);
    setQrImage(qrImageUrl);

    // Step 3: Save QR to backend
    try {
      await axios.post('http://localhost:5000/api/qrcodes', {
        image: qrImageUrl,
        batchId
      });
    } catch (qrErr) {
      console.error('QR Save Failed:', qrErr);
      alert('Batch created, but QR code save failed.');
      return;
    }

    alert(`✅ Batch created and QR saved! Batch ID: ${batchId}`);

    // Reset form
    setForm({
      medicineName: '',
      bigBoxCount: '',
      smallBoxPerBigBox: '',
      stripsPerSmallBox: ''
    });
  } catch (err) {
    console.error('Batch Creation Failed:', err);
    alert('❌ Error creating batch.');
  }
};


  return (
    <div className="batch-form">
      <h2>Create New Medicine Batch</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="medicineName" placeholder="Medicine Name" value={form.medicineName} onChange={handleChange} required />
        <input type="number" name="bigBoxCount" placeholder="Number of Big Boxes" value={form.bigBoxCount} onChange={handleChange} required />
        <input type="number" name="smallBoxPerBigBox" placeholder="Small Boxes per Big Box" value={form.smallBoxPerBigBox} onChange={handleChange} required />
        <input type="number" name="stripsPerSmallBox" placeholder="Strips per Small Box" value={form.stripsPerSmallBox} onChange={handleChange} required />
        <button type="submit">Create Batch</button>
      </form>

      {qrImage && (
        <div className="qr-preview">
          <h3>QR Code:</h3>
          <img src={qrImage} alt="QR Code" />
        </div>
      )}
    </div>
  );
};

export default BatchCreator;
