import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import './ManufacturerView.css';

const BatchDistributor = ({ userId }) => {
    const [batches, setBatches] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [qrImage, setQrImage] = useState(null);
    const [availableBoxes, setAvailableBoxes] = useState(0);
    
    const [form, setForm] = useState({
        distributorId: '',
        bigBoxCount: '',
    });

    // Fetch batches and distributors on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch manufacturer's batches
                const batchesRes = await axios.get(`http://localhost:5000/api/batches/by-user/${userId}`);
                console.log('Batches fetched:', batchesRes.data);
                setBatches(batchesRes.data);

                // Fetch distributors
                const distributorsRes = await axios.get('http://localhost:5000/api/distributions/distributors');
                console.log('Distributors fetched:', distributorsRes.data);
                setDistributors(distributorsRes.data);

                // Log useful debug info
                const user = JSON.parse(localStorage.getItem('user'));
                console.log('Current user:', { 
                    id: user?.id,
                    role: user?.role,
                    walletAddress: user?.walletAddress
                });
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.response) {
                    console.error('Response error:', err.response.data);
                    alert(`Error: ${err.response.data.error || 'Failed to fetch data'}`);
                } else {
                    alert('Network error - check console');
                }
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    // Calculate available boxes when batch is selected
    const handleBatchSelect = async (batchId) => {
        setSelectedBatch(batchId);
        try {
            const selectedBatchData = batches.find(b => b.batchId === batchId);
            if (selectedBatchData) {
                const totalBoxes = selectedBatchData.bigCartonCount * selectedBatchData.bigBoxPerCarton;
                // Get existing distributions for this batch
                const distributionsRes = await axios.get(`http://localhost:5000/api/distributions/by-manufacturer/${userId}`);
                const batchDistributions = distributionsRes.data.filter(d => d.batchId === batchId);
                const distributedBoxes = batchDistributions.reduce((sum, dist) => sum + dist.bigBoxCount, 0);
                setAvailableBoxes(totalBoxes - distributedBoxes);
            }
        } catch (err) {
            console.error('Error calculating available boxes:', err);
        }
    };

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

            const user = JSON.parse(localStorage.getItem('user'));
            if (!user?.token) {
                throw new Error('Please login first');
            }

            // Create distribution
            const distributionRes = await axios.post('http://localhost:5000/api/distributions/create', {
                batchId: selectedBatch,
                medicineName: selectedBatchData.medicineName,
                receiverId: form.distributorId,
                receiverRole: 'Wholesaler',
                bigBoxCount: parseInt(form.bigBoxCount),
                expiryDate: selectedBatchData.expiryDate
            }, { 
                headers: { 
                    'Authorization': `Bearer ${user.token}` 
                } 
            });

            // Generate QR Code for this distribution
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

            const qrString = JSON.stringify(qrData);
            const qrImageUrl = await QRCode.toDataURL(qrString);
            setQrImage(qrImageUrl);

            // Save QR code
            await axios.post('http://localhost:5000/api/qrcodes', {
                image: qrImageUrl,
                distributionId: distributionRes.data.distributionId
            });

            alert('✅ Distribution created successfully!');
            
            // Reset form
            setForm({
                distributorId: '',
                bigBoxCount: ''
            });
            setSelectedBatch('');
            
        } catch (err) {
            console.error('Distribution creation failed:', err);
            alert('❌ Error creating distribution');
        }
    };

    const filteredDistributors = distributors.filter(dist => 
        dist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    {batches.map(batch => (
                        <option key={batch.batchId} value={batch.batchId}>
                            {batch.medicineName} (ID: {batch.batchId})
                        </option>
                    ))}
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
                    onChange={(e) => setForm({...form, distributorId: e.target.value})}
                    required
                >
                    <option value="">Select Distributor</option>
                    {filteredDistributors.map(dist => (
                        <option key={dist._id} value={dist._id}>
                            {dist.name} - {dist.companyAddress}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    name="bigBoxCount"
                    placeholder="Number of Big Boxes"
                    value={form.bigBoxCount}
                    onChange={(e) => setForm({...form, bigBoxCount: e.target.value})}
                    max={availableBoxes}
                    required
                />

                <button type="submit">Create Distribution</button>
            </form>

            {qrImage && (
                <div className="qr-preview">
                    <h3>Distribution QR Code:</h3>
                    <img src={qrImage} alt="Distribution QR Code" />
                    <p>This QR code contains all distribution details</p>
                </div>
            )}
        </div>
    );
};

export default BatchDistributor;