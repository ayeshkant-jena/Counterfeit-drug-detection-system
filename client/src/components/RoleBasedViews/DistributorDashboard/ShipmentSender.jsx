import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ShipmentSender = ({ userId }) => {
  const [incoming, setIncoming] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [selectedDistribution, setSelectedDistribution] = useState('');
  const [available, setAvailable] = useState(0);
  const [form, setForm] = useState({ receiverId: '', bigBoxCount: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const inc = await axios.get(`http://localhost:5000/api/distributions/incoming/${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setIncoming(inc.data);
        const r = await axios.get('http://localhost:5000/api/distributions/retailers', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setRetailers(r.data);
      } catch (err) {
        console.error('Error fetching shipment sender data', err);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const handleSelect = async (distributionId) => {
    setSelectedDistribution(distributionId);
    const dist = incoming.find(d => d.distributionId === distributionId);
    if (!dist) return;
      try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/distributions/available/${userId}/${dist.batchId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setAvailable(res.data.available || 0);
    } catch (err) {
      console.error('Error fetching available boxes', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDistribution || !form.receiverId || !form.bigBoxCount) return alert('Fill all fields');
    const dist = incoming.find(d => d.distributionId === selectedDistribution);
    if (!dist) return alert('Select a valid distribution');
    if (form.bigBoxCount > available) return alert(`Only ${available} available`);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/distributions/create', {
        batchId: dist.batchId,
        medicineName: dist.medicineName,
        manufacturerId: dist.manufacturerId,
        receiverId: form.receiverId,
        receiverRole: 'Retailer',
        bigBoxCount: parseInt(form.bigBoxCount, 10),
        expiryDate: dist.expiryDate
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      alert('Distribution to retailer created');
      // reset
      setForm({ receiverId: '', bigBoxCount: '' });
      setSelectedDistribution('');
    } catch (err) {
      console.error('Error creating distribution to retailer', err);
      alert(err.response?.data?.error || 'Failed to create distribution');
    }
  };

  return (
    <div className="shipment-sender">
      <h3>Send to Retailer</h3>
      <div>
        <label>Select incoming batch (you received):</label>
        <select value={selectedDistribution} onChange={(e) => handleSelect(e.target.value)}>
          <option value="">Choose distribution</option>
          {incoming.map(d => (
            <option key={d.distributionId} value={d.distributionId}>{d.medicineName} - {d.batchId} (Boxes: {d.bigBoxCount})</option>
          ))}
        </select>
      </div>

      {selectedDistribution && (
        <div>
          <p>Available to send: {available}</p>
          <input type="number" placeholder="Big boxes to send" value={form.bigBoxCount} onChange={(e) => setForm({...form, bigBoxCount: e.target.value})} />
          <input type="text" placeholder="Search retailer by name" onChange={(e) => setForm({...form, search: e.target.value})} />
          <select value={form.receiverId} onChange={(e) => setForm({...form, receiverId: e.target.value})}>
            <option value="">Select Retailer</option>
            {retailers.map(r => (
              <option key={r._id} value={r._id}>{r.name} - {r.companyAddress}</option>
            ))}
          </select>
          <button onClick={handleSubmit}>Send to Retailer</button>
        </div>
      )}
    </div>
  );
};

export default ShipmentSender;
