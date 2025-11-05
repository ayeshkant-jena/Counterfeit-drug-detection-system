import React, { useState } from 'react';
import './DistributorView.css';

const BatchList = ({ batches, onUpdate, contract }) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateRemainingUnits = (batch) => {
    const total = batch.remainingMedicineCount;
    const perStrip = batch.tabletsPerStrip;
    const perSmallBox = perStrip * batch.stripsPerSmallBox;
    const perBigBox = perSmallBox * batch.smallBoxesPerBox;
    const perCarton = perBigBox * batch.boxesPerCarton;

    return {
      cartons: Math.floor(total / perCarton),
      bigBoxes: Math.floor((total % perCarton) / perBigBox),
      smallBoxes: Math.floor((total % perBigBox) / perSmallBox),
      strips: Math.floor((total % perSmallBox) / perStrip),
      tablets: total % perStrip
    };
  };

  const viewBatchDetails = (batch) => {
    setSelectedBatch(batch);
  };

  const verifyOnBlockchain = async (batch) => {
    if (!contract) {
      alert('Blockchain connection not available');
      return;
    }

    setLoading(true);
    try {
      const result = await contract.verifyBatch(batch.batchId);
      alert(`Batch verified on blockchain: ${result ? 'Valid' : 'Invalid'}`);
    } catch (err) {
      console.error('Blockchain verification failed:', err);
      alert('Failed to verify on blockchain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-list">
      <h2>Managed Batches</h2>
      
      <div className="batch-grid">
        {batches.map(batch => {
          const remaining = calculateRemainingUnits(batch);
          return (
            <div key={batch.batchId} className="batch-card">
              <div className="batch-header">
                <h3>{batch.medicineName}</h3>
                <span className={`status ${batch.status}`}>{batch.status}</span>
              </div>

              <div className="batch-info">
                <p><strong>Batch ID:</strong> {batch.batchId}</p>
                <p><strong>Manufacturer:</strong> {batch.manufacturer}</p>
                <p><strong>Expiry:</strong> {new Date(batch.expiryDate).toLocaleDateString()}</p>
              </div>

              <div className="remaining-count">
                <h4>Remaining Quantity:</h4>
                <ul>
                  {remaining.cartons > 0 && <li>{remaining.cartons} cartons</li>}
                  {remaining.bigBoxes > 0 && <li>{remaining.bigBoxes} big boxes</li>}
                  {remaining.smallBoxes > 0 && <li>{remaining.smallBoxes} small boxes</li>}
                  {remaining.strips > 0 && <li>{remaining.strips} strips</li>}
                  {remaining.tablets > 0 && <li>{remaining.tablets} tablets</li>}
                </ul>
                <p className="total-count">
                  Total: {batch.remainingMedicineCount.toLocaleString()} tablets
                </p>
              </div>

              <div className="batch-actions">
                <button 
                  onClick={() => viewBatchDetails(batch)}
                  className="view-btn"
                >
                  View Details
                </button>
                <button 
                  onClick={() => verifyOnBlockchain(batch)}
                  className="verify-btn"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify on Blockchain'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBatch && (
        <div className="batch-modal">
          <div className="modal-content">
            <h2>Batch Details</h2>
            <div className="details-grid">
              <div className="detail-group">
                <h3>Basic Information</h3>
                <p><strong>Medicine Name:</strong> {selectedBatch.medicineName}</p>
                <p><strong>Batch Number:</strong> {selectedBatch.batchNumber}</p>
                <p><strong>Manufacturer:</strong> {selectedBatch.manufacturer}</p>
                <p><strong>Manufacturing Date:</strong> {new Date(selectedBatch.manufacturingDate).toLocaleDateString()}</p>
                <p><strong>Expiry Date:</strong> {new Date(selectedBatch.expiryDate).toLocaleDateString()}</p>
              </div>

              <div className="detail-group">
                <h3>Quantity Structure</h3>
                <p><strong>Cartons:</strong> {selectedBatch.totalCartons}</p>
                <p><strong>Boxes per Carton:</strong> {selectedBatch.boxesPerCarton}</p>
                <p><strong>Small Boxes per Box:</strong> {selectedBatch.smallBoxesPerBox}</p>
                <p><strong>Strips per Small Box:</strong> {selectedBatch.stripsPerSmallBox}</p>
                <p><strong>Tablets per Strip:</strong> {selectedBatch.tabletsPerStrip}</p>
              </div>

              <div className="detail-group">
                <h3>Current Status</h3>
                <p><strong>Status:</strong> {selectedBatch.status}</p>
                <p><strong>Total Medicine Count:</strong> {selectedBatch.totalMedicineCount.toLocaleString()}</p>
                <p><strong>Remaining Medicine:</strong> {selectedBatch.remainingMedicineCount.toLocaleString()}</p>
                <p><strong>Blockchain Hash:</strong> {selectedBatch.blockchainHash}</p>
              </div>
            </div>

            <button onClick={() => setSelectedBatch(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchList;
