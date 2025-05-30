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
      // 1. Create batch on server
      const batchRes = await axios.post('http://localhost:5000/api/batches/create', {
        ...form,
        createdBy: userId
      });

      const batchId = batchRes.data.batchId;
      const qrData = {
        batchId,
        medicineName: form.medicineName,
        bigBoxCount: form.bigBoxCount,
        smallBoxPerBigBox: form.smallBoxPerBigBox,
        stripsPerSmallBox: form.stripsPerSmallBox
      };

      // 2. Generate QR Code
      const qrString = JSON.stringify(qrData);
      const qrImageUrl = await QRCode.toDataURL(qrString);
      setQrImage(qrImageUrl);

      // 3. Save QR code to backend
      await axios.post('http://localhost:5000/api/save-qr', {
        image: qrImageUrl,
        batchId
      });

      alert(`Batch created successfully! QR saved. Batch ID: ${batchId}`);

      // Reset form
      setForm({
        medicineName: '',
        bigBoxCount: '',
        smallBoxPerBigBox: '',
        stripsPerSmallBox: ''
      });

    } catch (err) {
      console.error(err);
      alert('Error creating batch or saving QR code');
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
