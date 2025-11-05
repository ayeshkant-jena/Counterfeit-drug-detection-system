import { useState, useEffect } from 'react';
import './ManufacturerView.css';
import BatchCreator from './BatchCreator';
import BatchList from './BatchList';
import BatchQRScanner from './BatchQRScanner';
import BatchDistributor from './BatchDistributor';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';
import { useNavigate } from 'react-router-dom';

const ManufacturerView = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Manufacturer";
  const walletAddress = user?.walletAddress?.toLowerCase();
  
  const [showBatchCreator, setShowBatchCreator] = useState(false);
  const [showBatchList, setShowBatchList] = useState(false);
  const [showBatchQRScanner, setShowBatchQRScanner] = useState(false);
  const [showBatchDistributor, setShowBatchDistributor] = useState(false);
  const [contract, setContract] = useState(null);
  const [batchesCount, setBatchesCount] = useState(0);

  // Verify we're properly logged in
  useEffect(() => {
    if (!user || !user.walletAddress || user.role !== 'Manufacturer') {
      alert('Please log in as a Manufacturer');
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const loadContract = async () => {
    if (!window.ethereum) {
      console.log("MetaMask not found - blockchain features disabled");
      return;
    }

    try {
      // Ask user to connect accounts (may throw if user cancels or request pending)
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      // ensure provider is ready
      await provider.ready;

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== (walletAddress || '').toLowerCase()) {
        alert('Please switch MetaMask to the account that matches your registered wallet address.');
        return;
      }

      const contractInstance = getContract(signer);
      setContract(contractInstance);
      console.log("Contract loaded for wallet:", walletAddress);
    } catch (err) {
      console.error("Contract loading failed:", err);
      if (err?.code === -32002) {
        alert('There is already a pending MetaMask request — please check your wallet and approve the connection.');
      } else if (err?.code === 4001) {
        alert('MetaMask connection was rejected. Please connect your wallet to use blockchain features.');
      } else {
        alert('Failed to connect to MetaMask. Ensure it is installed and unlocked.');
      }
    }
  };

  const fetchBatchesCount = async () => {
    try {
      // safe runtime check for process.env (works with CRA, Vite, etc.)
      const base =
        (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
          ? process.env.REACT_APP_API_BASE_URL
          : (window.REACT_APP_API_BASE_URL || 'http://localhost:5000');

      const res = await fetch(`${base}/api/batches/count`);
      if (!res.ok) {
        console.error('Batches count fetch failed:', res.status, await res.text());
        throw new Error('Network response was not ok');
      }
      const data = await res.json();
      setBatchesCount(Number(data.count) || 0);
    } catch (err) {
      console.error('Failed to fetch batches count', err);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadContract();
      fetchBatchesCount();
    }
  }, [walletAddress]);

  // refresh count when UI that can create/delete batches toggles
  useEffect(() => {
    if (walletAddress) {
      fetchBatchesCount();
    }
  }, [showBatchCreator, showBatchList, walletAddress]);

  if (!walletAddress) {
    return <div>Loading...</div>;
  }

  return (
    <div className="manufacturer-dashboard">
      <h1>Welcome, {name} 👋</h1>
      <h3>Your Wallet: {walletAddress}</h3>

      <div className="stats-cards">
        <div className="card">
          <h2>Batches Created</h2>
          <p>{batchesCount}</p>
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
        <button onClick={() => setShowBatchList(!showBatchList)}>
          {showBatchList ? 'Hide Batch List' : 'View Your Batches'}
        </button>
        <div style={{ display: 'inline-block' }}>
          <button onClick={() => setShowBatchQRScanner(!showBatchQRScanner)}>
            {showBatchQRScanner ? 'Hide QR Scanner' : 'Show QR Scanner'}
          </button>
        </div>
        <div style={{ display: 'inline-block' }}>
          <button onClick={() => setShowBatchDistributor(!showBatchDistributor)}>
            {showBatchDistributor ? 'Hide Batch Distribution' : 'Distribute Batch'}
          </button>
        </div>
      </div>

      {showBatchCreator && (
        <div className="batch-creator-section">
          <BatchCreator contract={contract} userId={walletAddress} />
        </div>
      )}

      {showBatchList && (
        <div className="batch-list-section">
          <BatchList userId={walletAddress} />
        </div>
      )}

      {showBatchQRScanner && (
        <div>
          <BatchQRScanner />
        </div>
      )}

      {showBatchDistributor && (
        <div className="batch-distributor-section">
          <BatchDistributor userId={walletAddress} />
        </div>
      )}
    </div>
  );
};

export default ManufacturerView;