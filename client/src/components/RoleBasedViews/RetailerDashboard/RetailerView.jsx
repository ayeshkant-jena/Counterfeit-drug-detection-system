import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QrScanner from 'qr-scanner';
import './RetailerView.css';
import BatchList from './BatchList';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const RetailerView = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const name = user?.name || 'Retailer';
  const walletAddress = user?.walletAddress?.toLowerCase();

  const [activeTab, setActiveTab] = useState('scan');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    shipmentsReceived: 0,
    activeBatches: 0,
    totalTablets: 0,
    soldTablets: 0
  });

  const [contract, setContract] = useState(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Auth check
  useEffect(() => {
    if (!user || !user.walletAddress || user.role !== 'Retailer') {
      alert('Please log in as a Retailer');
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Load blockchain contract
  const loadContract = async () => {
    if (!window.ethereum) {
      console.error('MetaMask not found - blockchain features disabled');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);
      setContract(contractInstance);
    } catch (err) {
      console.error('Contract loading failed:', err);
    }
  };

  // Fetch data
  useEffect(() => {
    if (walletAddress) {
      loadContract();
      fetchStats();
      fetchInventory();
    }
  }, [walletAddress]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [inventoryRes, salesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/batches/stats/${walletAddress}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/sales/stats/${walletAddress}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        shipmentsReceived: inventoryRes.data.received,
        activeBatches: inventoryRes.data.active,
        totalTablets: inventoryRes.data.totalTablets,
        soldTablets: salesRes.data.totalSold
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/batches/by-holder/${walletAddress}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  // QR Code Scanner
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      scannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          const qrData = JSON.parse(result.data);

          try {
            const token = localStorage.getItem('token');
            const verifyRes = await axios.post('http://localhost:5000/api/distributions/verify', {
              batchId: qrData.batchId,
              distributionId: qrData.distributionId,
              verificationCode: qrData.verificationCode
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            setScanResult({
              success: true,
              message: 'Shipment verified successfully!',
              data: verifyRes.data
            });

            // Update blockchain
            if (contract) {
              try {
                await contract.verifyDistribution(
                  qrData.batchId,
                  qrData.distributionId,
                  walletAddress
                );
              } catch (err) {
                console.error('Blockchain verification failed:', err);
              }
            }

            fetchInventory();
            fetchStats();

          } catch (err) {
            setScanResult({
              success: false,
              message: err.response?.data?.error || 'Verification failed',
              error: err.message
            });
          }
        },
        { highlightScanRegion: true }
      );

      scannerRef.current.start();
      setShowScanner(true);

    } catch (err) {
      console.error('Camera error:', err);
      alert('Cannot access camera. Please check permissions.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowScanner(false);
  };

  // Sale recording
  const recordSale = async (batchId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/sales/record', {
        batchId,
        quantity,
        retailerId: walletAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchInventory();
      fetchStats();
    } catch (err) {
      console.error('Error recording sale:', err);
      alert('Failed to record sale');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!walletAddress) return <div>Loading...</div>;

  return (
    <div className="retailer-dashboard">
      <h1>Welcome, {name}</h1>
      <div className="wallet-info">
        <span>🔗 {walletAddress}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Shipments Received</h3>
          <p>{stats.shipmentsReceived}</p>
        </div>
        <div className="stat-card">
          <h3>Active Batches</h3>
          <p>{stats.activeBatches}</p>
        </div>
        <div className="stat-card">
          <h3>Total Stock</h3>
          <p>{stats.totalTablets.toLocaleString()} tablets</p>
        </div>
        <div className="stat-card">
          <h3>Total Sold</h3>
          <p>{stats.soldTablets.toLocaleString()} tablets</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'scan' ? 'active' : ''} 
          onClick={() => setActiveTab('scan')}
        >
          Scan Shipment
        </button>
        <button 
          className={activeTab === 'inventory' ? 'active' : ''} 
          onClick={() => setActiveTab('inventory')}
        >
          Manage Inventory
        </button>
        <button 
          className={activeTab === 'sales' ? 'active' : ''} 
          onClick={() => setActiveTab('sales')}
        >
          Record Sales
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'scan' && (
          <div className="scanner-section">
            {!showScanner ? (
              <button onClick={startScanner}>Start QR Scanner</button>
            ) : (
              <>
                <button onClick={stopScanner}>Stop Scanner</button>
                <div className="video-container">
                  <video ref={videoRef} />
                </div>
              </>
            )}

            {scanResult && (
              <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                <h3>{scanResult.success ? '✅ Success' : '❌ Error'}</h3>
                <p>{scanResult.message}</p>
                {scanResult.success && (
                  <div className="shipment-details">
                    <p><strong>Batch ID:</strong> {scanResult.data.batchId}</p>
                    <p><strong>Medicine:</strong> {scanResult.data.medicineName}</p>
                    <p><strong>Quantity:</strong> {scanResult.data.quantity.total} units</p>
                    <p><strong>Manufacturer:</strong> {scanResult.data.manufacturer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <BatchList 
            batches={inventory}
            onUpdate={fetchInventory}
            contract={contract}
          />
        )}

        {activeTab === 'sales' && (
          <div className="sales-section">
            <h2>Record Medicine Sales</h2>
            {inventory.map(batch => (
              <div key={batch.batchId} className="sales-batch-card">
                <div className="batch-info">
                  <h3>{batch.medicineName}</h3>
                  <p>Batch ID: {batch.batchId}</p>
                  <p>Remaining: {batch.remainingMedicineCount.toLocaleString()} tablets</p>
                </div>
                <div className="sales-form">
                  <input 
                    type="number"
                    placeholder="Number of tablets"
                    min="1"
                    max={batch.remainingMedicineCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > batch.remainingMedicineCount) {
                        alert('Cannot sell more than available stock');
                        e.target.value = batch.remainingMedicineCount;
                      }
                    }}
                  />
                  <button onClick={(e) => {
                    const quantity = parseInt(e.target.previousSibling.value);
                    if (quantity > 0 && quantity <= batch.remainingMedicineCount) {
                      recordSale(batch.batchId, quantity);
                      e.target.previousSibling.value = '';
                    }
                  }}>
                    Record Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerView;