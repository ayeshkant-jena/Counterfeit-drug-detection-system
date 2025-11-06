import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const BatchDistributor = ({ userId: propUserId }) => {
  const [userId, setUserId] = useState('');
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const stored = localStorage.getItem('user');
  console.log("🟡 Raw localStorage user:", stored);
  console.log("🟢 Prop userId received:", propUserId);
}, [propUserId]);


  // ✅ STEP 1: Fetch userId from props or localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let effectiveUserId = null;

    try {
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      effectiveUserId = parsedUser?._id || parsedUser?.id || propUserId;

    } catch (err) {
      console.warn("⚠️ Failed to parse user from localStorage", err);
    }

    if (effectiveUserId) {
      setUserId(effectiveUserId);
      console.log("✅ Effective userId for BatchDistributor:", effectiveUserId);
    } else {
      console.warn("⚠️ No valid userId found in props or localStorage");
    }
  }, [propUserId]);

  // ✅ STEP 2: Fetch batches + distributors after userId is ready
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("📥 Fetching data for userId:", userId);

        // Fetch batches for this manufacturer
        const batchUrl = `http://localhost:5000/api/batches/by-user/${userId}`;
        const batchesRes = await axios.get(batchUrl);
        console.log("✅ API Response for batches:", batchesRes.data);

        if (Array.isArray(batchesRes.data)) {
          setBatches(batchesRes.data);
        } else if (batchesRes.data?.batches) {
          setBatches(batchesRes.data.batches);
        } else {
          console.warn("⚠️ Unexpected batches structure:", batchesRes.data);
          setBatches([]);
        }

        // Fetch distributors
        const distributorsRes = await axios.get('http://localhost:5000/api/distributions/distributors');
        console.log("✅ API Response for distributors:", distributorsRes.data);

        if (Array.isArray(distributorsRes.data)) {
          setDistributors(distributorsRes.data);
        } else if (distributorsRes.data?.distributors) {
          setDistributors(distributorsRes.data.distributors);
        } else {
          console.warn("⚠️ Unexpected distributors structure:", distributorsRes.data);
          setDistributors([]);
        }

      } catch (error) {
        console.error('❌ Error fetching data:', error);
        toast.error('Failed to fetch data. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ✅ STEP 3: Handle distribution submission
  const handleDistribute = async (e) => {
    e.preventDefault();

    if (!selectedBatch || !selectedDistributor || !quantity) {
      toast.warning('Please fill all fields before submitting.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/distributions/distribute', {
        batchId: selectedBatch,
        distributorId: selectedDistributor,
        quantity,
        manufacturerId: userId
      });

      if (response.status === 200) {
        toast.success('Batch successfully distributed!');
        // Reset form
        setSelectedBatch('');
        setSelectedDistributor('');
        setQuantity('');
      }
    } catch (error) {
      console.error('❌ Error distributing batch:', error);
      toast.error('Failed to distribute batch. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-distributor-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Distribute Batch to Distributor</h2>

      {loading && <p className="loading-text">Loading...</p>}

      <form onSubmit={handleDistribute} className="distribute-form">
        {/* Select Batch */}
        <div className="form-group">
          <label htmlFor="batch">Select Batch:</label>
          <select
            id="batch"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Select a Batch --</option>
            {batches.length > 0 ? (
              batches.map((batch, i) => (
                <option key={batch._id || batch.batchId || i} value={batch._id || batch.batchId}>
                  {batch.medicineName
                    ? `${batch.medicineName} (Batch ID: ${batch.batchId || batch._id})`
                    : `Batch ${i + 1}`}
                </option>
              ))
            ) : (
              <option disabled>⚠️ No batches found</option>
            )}
          </select>
          <p style={{ fontSize: '0.9em', color: batches.length > 0 ? 'green' : 'red' }}>
            {batches.length > 0
              ? `✅ Found ${batches.length} batches for this user`
              : '⚠️ No batches found for this user'}
          </p>
        </div>

        {/* Select Distributor */}
        <div className="form-group">
          <label htmlFor="distributor">Select Distributor:</label>
          <select
            id="distributor"
            value={selectedDistributor}
            onChange={(e) => setSelectedDistributor(e.target.value)}
          >
            <option value="">-- Select a Distributor --</option>
            {distributors.length > 0 ? (
              distributors.map((dist, i) => (
                <option key={dist._id || dist.id || i} value={dist._id || dist.id}>
                  {dist.name ? `${dist.name} (${dist.email || 'No email'})` : 'Unnamed Distributor'}
                </option>
              ))
            ) : (
              <option disabled>⚠️ No distributors found</option>
            )}
          </select>
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label htmlFor="quantity">Quantity to Distribute:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            placeholder="Enter quantity"
          />
        </div>

        <button type="submit" className="distribute-btn" disabled={loading}>
          {loading ? 'Processing...' : 'Distribute Batch'}
        </button>
      </form>
    </div>
  );
};

export default BatchDistributor;
