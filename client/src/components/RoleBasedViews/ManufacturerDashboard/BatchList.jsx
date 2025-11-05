// /client/src/components/ManufacturerDashboard/BatchList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManufacturerView.css';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?._id || user?.id; // ✅ handle both cases

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        console.log("🔍 Fetching batches for userId:", userId);
        const response = await axios.get(`http://localhost:5000/api/batches/by-user/${userId}`);
        console.log("✅ API Response:", response.data);
        setBatches(response.data);
      } catch (err) {
        console.error("❌ Error fetching batches:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchBatches();
  }, [userId]);

  const handleDownloadQR = (path, batchId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${path}`;
    link.download = `QR_${batchId}.png`;
    link.click();
  };

  if (loading) return <p>Loading batches...</p>;

  return (
    <div className="batch-list">
      <h2>Your Batches</h2>
      {batches.length === 0 ? (
        <p>No batches found.</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Medicine Name</th>
              <th>Big Boxes</th>
              <th>Small Boxes/Big Box</th>
              <th>Strips/Small Box</th>
              <th>Created At</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              // canonical and fallback calculations
              const bigBoxCount = batch.bigBoxCount 
                ?? (batch.bigCartonCount && batch.bigBoxPerCarton ? batch.bigCartonCount * batch.bigBoxPerCarton : undefined)
                ?? (batch.totalCartons && batch.boxesPerCarton ? batch.totalCartons * batch.boxesPerCarton : undefined);

              const smallBoxPerBigBox = batch.smallBoxPerBigBox ?? batch.smallBoxesPerBox ?? batch.smallBoxesPerBox;
              const stripsPerSmallBox = batch.stripsPerSmallBox ?? batch.stripsPerSmallBox ?? batch.stripsPerSmallBox;

              return (
                <tr key={batch.batchId}>
                  <td>{batch.batchId}</td>
                  <td>{batch.medicineName}</td>
                  <td>{typeof bigBoxCount !== 'undefined' ? bigBoxCount : 'N/A'}</td>
                  <td>{smallBoxPerBigBox ?? 'N/A'}</td>
                  <td>{stripsPerSmallBox ?? 'N/A'}</td>
                  <td>{new Date(batch.createdAt).toLocaleString()}</td>
                  <td>
                    {batch.qrCodePath ? (
                      <img
                        src={`http://localhost:5000${batch.qrCodePath}`}
                        alt="QR Code"
                        width="100"
                      />
                    ) : (
                      <span>No QR</span>
                    )}
                  </td>
                  <td>
                    {batch.qrCodePath && (
                      <button onClick={() => handleDownloadQR(batch.qrCodePath, batch.batchId)}>
                        Download QR
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BatchList;
