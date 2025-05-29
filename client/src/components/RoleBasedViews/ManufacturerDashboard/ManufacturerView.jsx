import React, { useState } from 'react';
import './ManufacturerView.css';
import BatchCreator from './BatchCreator';

const ManufacturerView = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Manufacturer";

  const [showBatchCreator, setShowBatchCreator] = useState(false);

  return (
    <div className="manufacturer-dashboard">
      <h1>Welcome, {name} 👋</h1>

      <div className="stats-cards">
        <div className="card">
          <h2>Batches Created</h2>
          <p>12</p>
        </div>
        <div className="card">
          <h2>Shipments Sent</h2>
          <p>8</p>
        </div>
        <div className="card">
          <h2>Pending Approvals</h2>
          <p>3</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setShowBatchCreator(!showBatchCreator)}>
          {showBatchCreator ? 'Hide Batch Creator' : 'Create New Batch'}
        </button>
        <button>View Shipments</button>
        <button>Scan QR Code</button>
      </div>

      {showBatchCreator && (
        <div className="batch-creator-section">
          <BatchCreator userId={user?._id} />
        </div>
      )}
    </div>
  );
};

export default ManufacturerView;
