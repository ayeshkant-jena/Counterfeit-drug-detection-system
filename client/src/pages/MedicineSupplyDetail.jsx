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
  { key: 'MANUFACTURED', name: 'Manufactured', received: false, date: null, details: {} },
  { key: 'SHIPPED_TO_DISTRIBUTOR', name: 'Shipped to Distributor', received: false, date: null, details: {} },
  { key: 'RECEIVED_BY_DISTRIBUTOR', name: 'Received by Distributor', received: false, date: null, details: {} },
  { key: 'SHIPPED_TO_RETAILER', name: 'Shipped to Retailer', received: false, date: null, details: {} },
  { key: 'RECEIVED_BY_RETAILER', name: 'Received by Retailer', received: false, date: null, details: {} },
  { key: 'DISPENSED_TO_PATIENT', name: 'Dispensed to Patient', received: false, date: null, details: {} }
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
      // Fetch batch details and supply chain events in parallel
      const [batchRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/batches/${id}`),
        fetch(`${API_BASE}/api/supply-chain/batch/${id}`)
      ]);

      if (!batchRes.ok) {
        const txt = await batchRes.text();
        throw new Error(txt || `Status ${batchRes.status}`);
      }

      const [batchData, eventsData] = await Promise.all([
        batchRes.json(),
        eventsRes.ok ? eventsRes.json() : []
      ]);

      // Convert events into supply chain format
      const supplyChain = JSON.parse(JSON.stringify(defaultSupplyChain));
      eventsData.forEach(event => {
        const chainStep = supplyChain.find(step => step.key === event.eventType);
        if (chainStep) {
          chainStep.received = true;
          chainStep.date = event.timestamp;
          chainStep.details = event.details || {};
          chainStep.location = event.location;
          chainStep.performedBy = event.performedBy;
        }
      });

      batchData.supplyChain = supplyChain;
      setBatch(batchData);
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
      // Get the user's authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to record events');
        return;
      }

      await fetch(`${API_BASE}/api/supply-chain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          batchId: id,
          eventType: stepKey,
          location: 'Current Location', // In a real app, this would be captured from user input or GPS
          details: {
            temperature: Math.round(20 + Math.random() * 5), // Simulated temperature between 20-25°C
            humidity: Math.round(40 + Math.random() * 20), // Simulated humidity between 40-60%
            notes: 'Event recorded via supply chain tracking system'
          }
        })
      });
      
      // re-fetch updated batch
      await fetchBatch(id);
    } catch (err) {
      console.error('Mark step failed', err);
      setError('Failed to record event. Please ensure you are logged in and have permission.');
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tick />
                      <span>{new Date(step.date).toLocaleString()}</span>
                    </div>
                    {step.location && (
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        Location: {step.location}
                      </div>
                    )}
                    {step.performedBy && (
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        By: {step.performedBy.name} ({step.performedBy.role})
                      </div>
                    )}
                    {step.details && Object.keys(step.details).length > 0 && (
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                        {step.details.temperature && <div>Temperature: {step.details.temperature}°C</div>}
                        {step.details.humidity && <div>Humidity: {step.details.humidity}%</div>}
                        {step.details.transportMethod && <div>Transport: {step.details.transportMethod}</div>}
                        {step.details.notes && <div>Notes: {step.details.notes}</div>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#b00', fontWeight: 700, marginRight: 6 }}>Pending</span>
                    {/* allow manual marking for demo / admin */}
                    {batch.batchId ? (
                      <button onClick={() => markStep(batch.batchId, step.key)} style={{ marginLeft: 12 }}>
                        Record Event
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
