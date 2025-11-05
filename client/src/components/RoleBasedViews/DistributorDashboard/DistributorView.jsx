import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QrScanner from 'qr-scanner';
import './DistributorView.css';
import BatchList from './BatchList';
import ShipmentSender from './ShipmentSender';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const DistributorView = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Distributor";
  const walletAddress = user?.walletAddress?.toLowerCase();
  
  const [activeTab, setActiveTab] = useState('scan');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [batches, setBatches] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [stats, setStats] = useState({
    batchesReceived: 0,
    shipmentsCreated: 0,
    activeBatches: 0
  });
  
  const [contract, setContract] = useState(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Auth check
  useEffect(() => {
    if (!user || !user.walletAddress || user.role !== 'Wholesaler') {
      alert('Please log in as a Wholesaler');
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Load blockchain contract
  const loadContract = async () => {
    if (!window.ethereum) {
      console.error("MetaMask not found - blockchain features disabled");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);
      setContract(contractInstance);
    } catch (err) {
      console.error("Contract loading failed:", err);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadContract();
      fetchStats();
      fetchBatches();
    }
  }, [walletAddress]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [batchesRes, distributionsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/batches/stats/${walletAddress}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/distributions/stats/${walletAddress}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        batchesReceived: batchesRes.data.received,
        shipmentsCreated: distributionsRes.data.created,
        activeBatches: batchesRes.data.active
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/batches/by-holder/${walletAddress}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(res.data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  // QR Code Scanner
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
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
              message: 'Batch verified successfully!',
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

            fetchBatches(); // Refresh batches list
            fetchStats(); // Update stats

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

  // Cleanup
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!walletAddress) return <div>Loading...</div>;

  return (
    <div className="distributor-dashboard">
      <h1>Welcome, {name}</h1>
      <div className="wallet-info">
        <span>🔗 {walletAddress}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Batches Received</h3>
          <p>{stats.batchesReceived}</p>
        </div>
        <div className="stat-card">
          <h3>Shipments Created</h3>
          <p>{stats.shipmentsCreated}</p>
        </div>
        <div className="stat-card">
          <h3>Active Batches</h3>
          <p>{stats.activeBatches}</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'scan' ? 'active' : ''} 
          onClick={() => setActiveTab('scan')}
        >
          Scan QR Code
        </button>
        <button 
          className={activeTab === 'batches' ? 'active' : ''} 
          onClick={() => setActiveTab('batches')}
        >
          Manage Batches
        </button>
        <button 
          className={activeTab === 'distribute' ? 'active' : ''} 
          onClick={() => setActiveTab('distribute')}
        >
          Distribute
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
                  <div className="batch-details">
                    <p><strong>Batch ID:</strong> {scanResult.data.batchId}</p>
                    <p><strong>Medicine:</strong> {scanResult.data.medicineName}</p>
                    <p><strong>Quantity:</strong> {scanResult.data.quantity.total} units</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'batches' && (
          <BatchList 
            batches={batches} 
            onUpdate={fetchBatches}
            contract={contract}
          />
        )}

        {activeTab === 'distribute' && (
          <ShipmentSender 
            batches={batches}
            contract={contract}
            userId={walletAddress}
            onDistributionComplete={() => {
              fetchBatches();
              fetchStats();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DistributorView;
