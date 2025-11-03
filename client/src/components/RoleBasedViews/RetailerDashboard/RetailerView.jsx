// /client/src/components/RetailerDashboard/RetailerView.jsx
import { useState, useEffect } from 'react';
import './RetailerView.css';
import BatchList from './BatchList';
import BatchReceiver from './BatchReceiver'; // QR scanner to receive shipment
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const RetailerView = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Retailer";
  const [showBatchList, setShowBatchList] = useState(false);
  const [showReceiver, setShowReceiver] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

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

  useEffect(() => {
    connectWalletAndLoadContract();
  }, []);

  return (
    <div className="retailer-dashboard">
      <h1>Welcome, {name} 🏪</h1>
      <h3>Your Wallet: {account}</h3>

      <div className="stats-cards">
        <div className="card">
          <h2>Shipments Received</h2>
          <p>9</p>
        </div>
        <div className="card">
          <h2>Stock In Store</h2>
          <p>15</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setShowBatchList(!showBatchList)}>
          {showBatchList ? 'Hide Batches' : 'View Inventory'}
        </button>
        <button onClick={() => setShowReceiver(!showReceiver)}>
          {showReceiver ? 'Hide QR Scanner' : 'Receive via QR'}
        </button>
      </div>

  {showBatchList && <BatchList userId={user?.walletAddress || account} />}
  {showReceiver && contract && <BatchReceiver contract={contract} userId={user?.walletAddress || account} />}
    </div>
  );
};

export default RetailerView;
