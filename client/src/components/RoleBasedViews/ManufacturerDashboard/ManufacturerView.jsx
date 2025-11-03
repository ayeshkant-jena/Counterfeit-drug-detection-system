import { useState, useEffect } from 'react';
import './ManufacturerView.css';
import BatchCreator from './BatchCreator';
import BatchList from './BatchList';
import BatchQRScanner from './BatchQRScanner';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const ManufacturerView = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Manufacturer";
  const [showBatchCreator, setShowBatchCreator] = useState(false);
  const [showBatchList, setShowBatchList] = useState(false);
  const [showBatchQRScanner, setShowBatchQRScanner] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [batchesCount, setBatchesCount] = useState(0);

  const connectWalletAndLoadContract = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contractInstance = getContract(signer);

        setAccount(accounts[0]);
        setContract(contractInstance);
        console.log("Connected wallet:", accounts[0]);
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      alert("Please install MetaMask to use blockchain features.");
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
    connectWalletAndLoadContract();
    fetchBatchesCount();
    // cleanup on unmount handled in other components if any
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh count when UI that can create/delete batches toggles (optional)
  useEffect(() => {
    fetchBatchesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBatchCreator, showBatchList]);

  return (
    <div className="manufacturer-dashboard">
      <h1>Welcome, {name} 👋</h1>
      <h3>Your Wallet: {account}</h3>

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
      </div>

      {showBatchCreator && contract && (
        <div className="batch-creator-section">
          <BatchCreator contract={contract} userId={account} />
        </div>
      )}

      {showBatchList && account && (
        <div className="batch-list-section">
          <BatchList userId={account} />
        </div>
      )}

      {showBatchQRScanner && (
        <div>
          <BatchQRScanner />
        </div>
      )}
    </div>
  );
};

export default ManufacturerView;