// /client/src/components/DistributorDashboard/DistributorView.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  const [showBatchList, setShowBatchList] = useState(false);
  const [showShipmentSender, setShowShipmentSender] = useState(false);
  const [contract, setContract] = useState(null);

  // Verify we're properly logged in with correct role
  useEffect(() => {
    if (!user || !user.walletAddress || user.role !== 'Wholesaler') {
      alert('Please log in as a Wholesaler');
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);
      setContract(contractInstance);
      console.log("Contract loaded for wallet:", walletAddress);
    } catch (err) {
      console.error("Contract loading failed:", err);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadContract();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return <div>Loading...</div>;
  }

  return (
    <div className="distributor-dashboard">
      <h1>Welcome, {name} 📦</h1>
      <h3>Your Wallet: {walletAddress}</h3>

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

  {showBatchList && <BatchList userId={walletAddress} />}
  {showShipmentSender && <ShipmentSender contract={contract} userId={walletAddress} />}
    </div>
  );
};

export default DistributorView;
