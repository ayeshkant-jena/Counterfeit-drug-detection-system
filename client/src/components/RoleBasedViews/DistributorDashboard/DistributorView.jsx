// /client/src/components/DistributorDashboard/DistributorView.jsx
import { useState, useEffect } from 'react';
import './DistributorView.css';
import BatchList from './BatchList';
// import ShipmentSender from './ShipmentSender';
import { ethers } from 'ethers';
import { getContract } from '../../../blockchain/contract-config';

const DistributorView = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Distributor";
  const [showBatchList, setShowBatchList] = useState(false);
  const [showShipmentSender, setShowShipmentSender] = useState(false);
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
    <div className="distributor-dashboard">
      <h1>Welcome, {name} 📦</h1>
      <h3>Your Wallet: {account}</h3>

      <div className="stats-cards">
        <div className="card">
          <h2>Batches Received</h2>
          <p>10</p>
        </div>
        <div className="card">
          <h2>Shipments Sent</h2>
          <p>6</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setShowBatchList(!showBatchList)}>
          {showBatchList ? 'Hide Batches' : 'View Received Batches'}
        </button>
        <button onClick={() => setShowShipmentSender(!showShipmentSender)}>
          {showShipmentSender ? 'Hide Sender' : 'Send to Retailer'}
        </button>
      </div>

      {showBatchList && <BatchList userId={account} />}
      {showShipmentSender && contract && <ShipmentSender contract={contract} userId={account} />}
    </div>
  );
};

export default DistributorView;
