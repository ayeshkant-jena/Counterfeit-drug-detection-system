// /client/src/components/ManufacturerDashboard/BatchList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManufacturerView.css';

const BatchList = ({ userId }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/batches/by-user/${userId}`);
        setBatches(response.data);
      } catch (err) {
        console.error("Error fetching batches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
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
            {batches.map((batch) => (
              <tr key={batch.batchId}>
                <td>{batch.batchId}</td>
                <td>{batch.medicineName}</td>
                <td>{batch.bigBoxCount}</td>
                <td>{batch.smallBoxPerBigBox}</td>
                <td>{batch.stripsPerSmallBox}</td>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BatchList;
