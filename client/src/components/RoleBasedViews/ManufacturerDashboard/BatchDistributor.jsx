import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import './ManufacturerView.css';

const BatchDistributor = ({ userId: propUserId }) => {
    const [batches, setBatches] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [qrImage, setQrImage] = useState(null);
    const [availableBoxes, setAvailableBoxes] = useState(0);
    const [loading, setLoading] = useState(true); // ✅ FIXED: Add loading indicator

    const [form, setForm] = useState({
        distributorId: '',
        bigBoxCount: '',
    });

    // ✅ FIXED: Unified userId handling
    const [userId, setUserId] = useState(propUserId || '');

    useEffect(() => {
        // Load from localStorage if propUserId missing
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!propUserId && storedUser?.id) {
            setUserId(storedUser.id);
        }
    }, [propUserId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // ✅ Fetch manufacturer's batches
                const batchesRes = await axios.get(`http://localhost:5000/api/batches/by-user/${userId}`);
                console.log('✅ Batches fetched:', batchesRes.data);
                setBatches(Array.isArray(batchesRes.data) ? batchesRes.data : []);

                // ✅ Fetch distributors
                const distributorsRes = await axios.get('http://localhost:5000/api/distributions/distributors');
                console.log('✅ Distributors fetched:', distributorsRes.data);
                setDistributors(Array.isArray(distributorsRes.data) ? distributorsRes.data : []);

                // Log useful info
                const user = JSON.parse(localStorage.getItem('user'));
                console.log('Current user:', { 
                    id: user?.id,
                    role: user?.role,
                    walletAddress: user?.walletAddress
                });
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                alert(`Error fetching data: ${err.response?.data?.error || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    // ✅ Calculate available boxes
    const handleBatchSelect = async (batchId) => {
        setSelectedBatch(batchId);
        try {
            const selectedBatchData = batches.find(b => b.batchId === batchId);
            if (selectedBatchData) {
                const bigBoxCount = selectedBatchData.bigBoxCount
                    ?? (selectedBatchData.bigCartonCount && selectedBatchData.bigBoxPerCarton
                        ? selectedBatchData.bigCartonCount * selectedBatchData.bigBoxPerCarton
                        : undefined)
                    ?? (selectedBatchData.totalCartons && selectedBatchData.boxesPerCarton
                        ? selectedBatchData.totalCartons * selectedBatchData.boxesPerCarton
                        : 0);

                const distributionsRes = await axios.get(`http://localhost:5000/api/distributions/by-manufacturer/${userId}`);
                const batchDistributions = distributionsRes.data.filter(d => d.batchId === batchId);
                const distributedBoxes = batchDistributions.reduce((sum, dist) => sum + Number(dist.bigBoxCount || 0), 0);
                setAvailableBoxes((bigBoxCount || 0) - distributedBoxes);
            }
        } catch (err) {
            console.error('Error calculating available boxes:', err);
        }
    };

    // ✅ Handle distribution submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBatch || !form.distributorId || !form.bigBoxCount) {
            alert('Please fill all required fields');
            return;
        }

        if (form.bigBoxCount > availableBoxes) {
            alert(`Only ${availableBoxes} boxes available for distribution`);
            return;
        }

        try {
            const selectedBatchData = batches.find(b => b.batchId === selectedBatch);
            const selectedDistributor = distributors.find(d => d._id === form.distributorId);
            const token = localStorage.getItem('token');

            if (!token) throw new Error('Please login first');

            // ✅ Create distribution
            const distributionRes = await axios.post('http://localhost:5000/api/distributions/create', {
                batchId: selectedBatch,
                medicineName: selectedBatchData.medicineName,
                receiverId: form.distributorId,
                receiverRole: 'Wholesaler',
                bigBoxCount: parseInt(form.bigBoxCount),
                expiryDate: selectedBatchData.expiryDate
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // ✅ Generate QR code
            const qrData = {
                distributionId: distributionRes.data.distributionId,
                batchId: selectedBatch,
                medicineName: selectedBatchData.medicineName,
                manufacturerWallet: userId,
                distributorWallet: selectedDistributor.walletAddress,
                bigBoxCount: parseInt(form.bigBoxCount),
                expiryDate: selectedBatchData.expiryDate,
                timestamp: new Date().toISOString()
            };

            const qrImageUrl = await QRCode.toDataURL(JSON.stringify(qrData));
            setQrImage(qrImageUrl);

            // ✅ Save QR code
            await axios.post('http://localhost:5000/api/qrcodes', {
                image: qrImageUrl,
                distributionId: distributionRes.data.distributionId
            });

            alert('✅ Distribution created successfully!');

            // Reset form
            setForm({ distributorId: '', bigBoxCount: '' });
            setSelectedBatch('');
        } catch (err) {
            console.error('❌ Distribution creation failed:', err);
            alert(`Error creating distribution: ${err.response?.data?.error || err.message}`);
        }
    };

    // ✅ Filter distributors
    const filteredDistributors = distributors.filter(dist =>
        dist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ Loading indicator
    if (loading) return <p>Loading batches and distributors...</p>;

    return (
        <div className="batch-distributor">
            <h2>Distribute Medicine Batch</h2>
            <form onSubmit={handleSubmit}>
                <select
                    value={selectedBatch}
                    onChange={(e) => handleBatchSelect(e.target.value)}
                    required
                >
                    <option value="">Select Batch</option>
                    {Array.isArray(batches) && batches.length > 0 ? (
                        batches.map(batch => (
                            <option key={batch.batchId} value={batch.batchId}>
                                {batch.medicineName} (ID: {batch.batchId})
                            </option>
                        ))
                    ) : (
                        <option disabled>No batches found</option>
                    )}
                </select>

                {selectedBatch && (
                    <p>Available Boxes: {availableBoxes}</p>
                )}

                <input
                    type="text"
                    placeholder="Search distributors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    name="distributorId"
                    value={form.distributorId}
                    onChange={(e) => setForm({ ...form, distributorId: e.target.value })}
                    required
                >
                    <option value="">Select Distributor</option>
                    {Array.isArray(filteredDistributors) && filteredDistributors.length > 0 ? (
                        filteredDistributors.map(dist => (
                            <option key={dist._id} value={dist._id}>
                                {dist.name} - {dist.companyAddress}
                            </option>
                        ))
                    ) : (
                        <option disabled>No distributors found</option>
                    )}
                </select>

                <input
                    type="number"
                    name="bigBoxCount"
                    placeholder="Number of Big Boxes"
                    value={form.bigBoxCount}
                    onChange={(e) => setForm({ ...form, bigBoxCount: e.target.value })}
                    max={availableBoxes}
                    required
                />

                <button type="submit">Create Distribution</button>
            </form>

            {qrImage && (
                <div className="qr-preview">
                    <h3>Distribution QR Code:</h3>
                    <img src={qrImage} alt="Distribution QR Code" />
                    <p>This QR code contains all distribution details.</p>
                </div>
            )}
        </div>
    );
};

export default BatchDistributor;
