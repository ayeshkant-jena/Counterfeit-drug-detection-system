import React, { useEffect, useState } from 'react';
import './CSS/MedicineSupplyDetail.css';
import icon6 from '../assets/icon6.png';
import icon7 from '../assets/icon7.png';
import icon4 from '../assets/icon4.png';
import icon3 from '../assets/icon3.png';
import cargo from '../assets/cargo.png';
import factory from '../assets/factory.png';
import human from '../assets/human.png';
import pharmacy from '../assets/pharmacy.png';
import warehouse from '../assets/warehouse.png';

const API_BASE = (window && window.REACT_APP_API_BASE_URL) || 'http://localhost:5000';

const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString();
};

const Tick = () => <span style={{ color: 'green', fontWeight: 700, marginRight: 6 }}>✓</span>;

const defaultSupplyChain = [
  { key: 'manufactured', name: 'Manufactured', received: false, date: null },
  { key: 'shippedToDistributor', name: 'Shipped to Distributor', received: false, date: null },
  { key: 'receivedByDistributor', name: 'Received by Distributor', received: false, date: null },
  { key: 'shippedToPharmacist', name: 'Shipped to Pharmacist', received: false, date: null },
  { key: 'receivedByPharmacist', name: 'Received by Pharmacist', received: false, date: null },
  { key: 'pickedUpByPatient', name: 'Picked up by Patient', received: false, date: null }
];

const emptyBatchTemplate = {
  batchId: '',
  medicineName: '-',
  createdBy: '-',
  expiryDate: null,
  supplyChain: defaultSupplyChain
};

const MedicineSupplyDetail = () => {
  // try to read batchId from query params (may be absent)
  const params = new URLSearchParams(window.location.search);
  const initialQueryBatchId = params.get('batchId') || '';
  const initialStepToMark = params.get('step') || '';

  const [inputBatchId, setInputBatchId] = useState(initialQueryBatchId);
  const [batch, setBatch] = useState({ ...emptyBatchTemplate });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepToMark, setStepToMark] = useState(initialStepToMark);

  const fetchBatch = async (id) => {
    if (!id) {
      setError('');
      setBatch({ ...emptyBatchTemplate, batchId: '' });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/batches/${id}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();
      // ensure supplyChain exists
      data.supplyChain = Array.isArray(data.supplyChain) && data.supplyChain.length ? data.supplyChain : JSON.parse(JSON.stringify(defaultSupplyChain));
      setBatch(data);
    } catch (err) {
      console.error('Fetch batch error', err);
      setError('Batch not found or server error.');
      setBatch({ ...emptyBatchTemplate, batchId: id });
    } finally {
      setLoading(false);
    }
  };

  const markStep = async (id, stepKey) => {
    if (!id || !stepKey) return;
    try {
      await fetch(`${API_BASE}/api/batches/${id}/supply-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepKey })
      });
      // re-fetch updated batch
      await fetchBatch(id);
    } catch (err) {
      console.error('Mark step failed', err);
      setError('Failed to update step.');
    }
  };

  // on mount, if batchId present in URL, fetch and optionally mark step
  useEffect(() => {
    (async () => {
      if (initialQueryBatchId) {
        if (stepToMark) {
          await markStep(initialQueryBatchId, stepToMark);
          // remove step param to avoid repeated marking
          const url = new URL(window.location.href);
          url.searchParams.delete('step');
          window.history.replaceState({}, '', url.toString());
          setStepToMark('');
        } else {
          await fetchBatch(initialQueryBatchId);
        }
      } else {
        // show empty UI with placeholders / default supply chain
        setBatch({ ...emptyBatchTemplate });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFetchClick = async (e) => {
    e.preventDefault();
    setError('');
    await fetchBatch(inputBatchId.trim());
  };

  return (
    <div className="medicine-container">
      <h1>Medicine Details</h1>

      <div style={{ marginBottom: 12 }}>
        <form onSubmit={onFetchClick} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Batch ID (or scan QR to load)"
            value={inputBatchId}
            onChange={(e) => setInputBatchId(e.target.value)}
            style={{ padding: 8, minWidth: 320 }}
          />
          <button type="submit">Load</button>
          <button type="button" onClick={() => { setInputBatchId(''); setBatch({ ...emptyBatchTemplate }); setError(''); }}>
            Clear
          </button>
          {loading && <span style={{ marginLeft: 8 }}>Loading...</span>}
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>

      <div className='medicine-detail-container'>
        <div className='medicine-detail-container-grid'>
          <div className='medicine-detail-container-grids'>
            <div className='div1'>
              <img src={icon6} alt="" />
            </div>
            <div className='div2'>
              <h3>Manufacturer Name</h3>
              <p>{batch.createdBy || '-'}</p>
            </div>
          </div>
          <div className='medicine-detail-container-grids'>
            <div className='div1'>
              <img src={icon7} alt="" />
            </div>
            <div className='div2'>
              <h3>Medicine Name</h3>
              <p>{batch.medicineName || '-'}</p>
            </div>
          </div>
          <div className='medicine-detail-container-grids'>
            <div className='div1'>
              <img src={icon4} alt="" />
            </div>
            <div className='div2'>
              <h3>Batch Number</h3>
              <p>{batch.batchId || '-'}</p>
            </div>
          </div>
          <div className='medicine-detail-container-grids'>
            <div className='div1'>
              <img src={icon3} alt="" />
            </div>
            <div className="div2">
              <h3>Expiration Date</h3>
              <p>{batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <span style={{ width: '100%', height: '30px' }}></span>
      <h2>Supply Chain History</h2>
      <div className='supply-chain'>
        <div className='supply-chain-grid'>
          {Array.isArray(batch.supplyChain) && batch.supplyChain.map(step => (
            <div className='supply-chain-grids' key={step.key}>
              <div className='scg1'>
                <img
                  src={
                    step.key === 'manufactured' ? factory :
                      (step.key.toLowerCase().includes('ship') ? cargo :
                        (step.key.toLowerCase().includes('distributor') ? warehouse :
                          (step.key.toLowerCase().includes('pharmacist') ? pharmacy : human)))
                  }
                  alt=""
                />
                <h3>{step.name}</h3>
              </div>
              <div className='scg2'>
                {step.received ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tick />
                    <span>{formatDate(step.date)}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#b00', fontWeight: 700, marginRight: 6 }}>Not received</span>
                    {/* allow manual marking for demo / admin */}
                    {batch.batchId ? (
                      <button onClick={() => markStep(batch.batchId, step.key)} style={{ marginLeft: 12 }}>
                        Mark received
                      </button>
                    ) : (
                      <span style={{ marginLeft: 12, color: '#666' }}>Provide batch ID to update</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicineSupplyDetail;
