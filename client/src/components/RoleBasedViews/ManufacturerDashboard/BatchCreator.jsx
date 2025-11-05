import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import './ManufacturerView.css';

// Function to generate random alphanumeric string
const generateBatchNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 5 },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
};

const BatchCreator = ({ userId }) => {
  // Get logged in user data
  const user = JSON.parse(localStorage.getItem('user'));
  const manufacturerName = user?.name || 'Unknown Manufacturer';

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    medicineName: '',
    expiryDate: '',
    totalCartons: '',
    boxesPerCarton: '',
    smallBoxesPerBox: '',
    stripsPerSmallBox: '',
    tabletsPerStrip: '',
    batchNumber: generateBatchNumber(),
    manufacturingDate: today, // Initialize with today's date
    manufacturer: manufacturerName // Initialize with logged in manufacturer's name
  });

  const [totalMedicineCount, setTotalMedicineCount] = useState(0);
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    // Calculate total medicine count when form values change
    const total = 
      Number(form.totalCartons) *
      Number(form.boxesPerCarton) *
      Number(form.smallBoxesPerBox) *
      Number(form.stripsPerSmallBox) *
      Number(form.tabletsPerStrip);
    
    setTotalMedicineCount(isNaN(total) ? 0 : total);
  }, [form]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first');

      // Create batch with medicine count calculations
      const batchRes = await axios.post('http://localhost:5000/api/batches/create', {
        ...form,
        totalMedicineCount,
        remainingMedicineCount: totalMedicineCount, // Initially same as total
        status: 'created'
      }, { 
        headers: { Authorization: `Bearer ${token}` }
      });

      const { batchId, blockchainHash } = batchRes.data;

      // Generate QR Code with minimal but essential data
      const qrData = {
        batchId,
        blockchainHash,
        medicineName: form.medicineName,
        batchNumber: form.batchNumber,
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
        manufacturer: form.manufacturer
      };

      const qrString = JSON.stringify(qrData);
      const qrImageUrl = await QRCode.toDataURL(qrString);
      setQrImage(qrImageUrl);

      // Save QR to backend
      await axios.post('http://localhost:5000/api/qrcodes', {
        image: qrImageUrl,
        batchId,
        type: 'batch'
      });

      alert(`✅ Batch created successfully!\nBatch ID: ${batchId}\nTotal Medicine Count: ${totalMedicineCount}`);

      // Reset form
      setForm({
        medicineName: '',
        expiryDate: '',
        totalCartons: '',
        boxesPerCarton: '',
        smallBoxesPerBox: '',
        stripsPerSmallBox: '',
        tabletsPerStrip: '',
        batchNumber: '',
        manufacturingDate: '',
        manufacturer: ''
      });
      setQrImage(null);

    } catch (err) {
      console.error('Batch Creation Failed:', err);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message;
      alert(`❌ Error creating batch: ${msg}`);
    }
  };

  return (
    <div className="batch-form">
      <h2>Create New Medicine Batch</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Medicine Details</h3>
          <input 
            type="text" 
            name="medicineName" 
            placeholder="Medicine Name" 
            value={form.medicineName} 
            onChange={handleChange} 
            required 
          />
          <div className="batch-number-field">
            <input 
              type="text" 
              name="batchNumber" 
              placeholder="Batch Number" 
              value={form.batchNumber} 
              readOnly
              required 
            />
            <button 
              type="button" 
              onClick={() => setForm(prev => ({
                ...prev,
                batchNumber: generateBatchNumber()
              }))}
              className="regenerate-btn"
            >
              🔄 Regenerate
            </button>
          </div>
          <div className="manufacturer-field">
            <input 
              type="text" 
              name="manufacturer" 
              placeholder="Manufacturer Name" 
              value={form.manufacturer} 
              readOnly
              required 
            />
            <span className="field-info">👤 Auto-filled from your profile</span>
          </div>
          <div className="date-field">
            <input 
              type="date" 
              name="manufacturingDate" 
              placeholder="Manufacturing Date" 
              value={form.manufacturingDate} 
              readOnly
              required 
            />
            <span className="field-info">📅 Today's date</span>
          </div>
          <input 
            type="date" 
            name="expiryDate" 
            placeholder="Expiry Date" 
            value={form.expiryDate} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-section">
          <h3>Quantity Details</h3>
          <input 
            type="number" 
            name="totalCartons" 
            placeholder="Number of Cartons" 
            value={form.totalCartons} 
            onChange={handleChange} 
            min="1" 
            required 
          />
          <input 
            type="number" 
            name="boxesPerCarton" 
            placeholder="Boxes per Carton" 
            value={form.boxesPerCarton} 
            onChange={handleChange} 
            min="1" 
            required 
          />
          <input 
            type="number" 
            name="smallBoxesPerBox" 
            placeholder="Small Boxes per Box" 
            value={form.smallBoxesPerBox} 
            onChange={handleChange} 
            min="1" 
            required 
          />
          <input 
            type="number" 
            name="stripsPerSmallBox" 
            placeholder="Strips per Small Box" 
            value={form.stripsPerSmallBox} 
            onChange={handleChange} 
            min="1" 
            required 
          />
          <input 
            type="number" 
            name="tabletsPerStrip" 
            placeholder="Tablets per Strip" 
            value={form.tabletsPerStrip} 
            onChange={handleChange} 
            min="1" 
            required 
          />
        </div>

        <div className="medicine-count">
          <strong>Total Medicine Count: </strong>
          {totalMedicineCount.toLocaleString()} tablets
        </div>

        <button type="submit">Create Batch</button>
      </form>

      {qrImage && (
        <div className="qr-preview">
          <h3>Batch QR Code</h3>
          <img src={qrImage} alt="Batch QR Code" />
          <p>This QR code contains essential batch verification data</p>
        </div>
      )}
    </div>
  );
};

export default BatchCreator;
