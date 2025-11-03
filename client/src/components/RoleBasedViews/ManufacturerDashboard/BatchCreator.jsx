import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import './ManufacturerView.css';

const BatchCreator = ({ userId }) => {
  const [form, setForm] = useState({
    medicineName: '',
    expiryDate: '',
    bigCartonCount: '',
    bigBoxPerCarton: '',
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
      expiryDate: form.expiryDate,
      bigCartonCount: form.bigCartonCount,
      bigBoxPerCarton: form.bigBoxPerCarton,
      smallBoxPerBigBox: form.smallBoxPerBigBox,
      stripsPerSmallBox: form.stripsPerSmallBox,
      createdBy: userId,
      createdAt: new Date().toISOString()
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
      expiryDate: '',
      bigCartonCount: '',
      bigBoxPerCarton: '',
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
        <input type="date" name="expiryDate" placeholder="Expiry Date" value={form.expiryDate} onChange={handleChange} required />
        <input type="number" name="bigCartonCount" placeholder="Number of Big Cartons" value={form.bigCartonCount} onChange={handleChange} required />
        <input type="number" name="bigBoxPerCarton" placeholder="Big Boxes per Carton" value={form.bigBoxPerCarton} onChange={handleChange} required />
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
