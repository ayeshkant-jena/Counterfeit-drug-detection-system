import React, { useEffect, useState, useRef } from 'react';
import './ManufacturerView.css';
import BatchCreator from './BatchCreator';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const ManufacturerView = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Manufacturer";

  const [showBatchCreator, setShowBatchCreator] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const connectingRef = useRef(false); // Prevent multiple connect calls

  const connectWalletAndLoadContract = async () => {
    if (!window.ethereum || connectingRef.current) return;

    connectingRef.current = true;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);

      setAccount(accounts[0]);
      setContract(contractInstance);

      console.log("Connected wallet:", accounts[0]);
      console.log("Contract loaded:", contractInstance.target);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      connectingRef.current = false;
    }
  };

  useEffect(() => {
    connectWalletAndLoadContract();
  }, []);

  return (
    <div className="manufacturer-dashboard">
      <h1>Welcome, {name} 👋</h1>

      <div className="stats-cards">
        <div className="card">
          <h2>Batches Created</h2>
          <p>12</p>
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
        <button>View Shipments</button>
        <button>Scan QR Code</button>
      </div>

      {showBatchCreator && contract && (
        <div className="batch-creator-section">
          <BatchCreator contract={contract} userId={account} />
        </div>
      )}
    </div>
  );
};

export default ManufacturerView;
