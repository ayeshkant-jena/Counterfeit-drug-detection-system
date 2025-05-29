// components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ role }) => {
  return (
    <div className="sidebar">
      <h2>Dashboard</h2>
      <ul>
        <li><Link to="/">Home</Link></li>

        {role === 'Manufacturer' && (
          <>
            <li><Link to="/add-batch">Add Drug Batch</Link></li>
            <li><Link to="/my-batches">My Batches</Link></li>
          </>
        )}

        {role === 'Distributor' && (
          <>
            <li><Link to="/incoming-batches">Incoming Batches</Link></li>
            <li><Link to="/transfer-batches">Transfer to Retailer</Link></li>
          </>
        )}

        {role === 'Retailer' && (
          <>
            <li><Link to="/verify-batch">Verify Drug</Link></li>
            <li><Link to="/my-inventory">My Inventory</Link></li>
          </>
        )}

        <li><Link to="/profile">Profile</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
