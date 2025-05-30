// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import './Dashboard.css';
import ManufacturerView from "./RoleBasedViews/ManufacturerDashboard/ManufacturerView";
import DistributorView from "./RoleBasedViews/DistributorDashboard/DistributorView";
import RetailerView from "./RoleBasedViews/RetailerDashboard/RetailerView";

  const Dashboard = () => {
  const [user, setUser] = useState(null);

  const role = JSON.parse(localStorage.getItem("user"))?.role;

  useEffect(() => {
    // Simulated JWT decoding or fetch from backend
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  const renderDashboard = () => {
    switch (role) {
      case 'Manufacturer':
        return <ManufacturerView />;
      case 'Distributor':
        return <DistributorView />;
      case 'Retailer':
        return <RetailerView />;
      default:
        return <div>Unauthorized Role</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar role={user.role}/>
      <div className="dashboard-content">
        <Navbar username={user.name} role={user.role}/>
        {renderDashboard()}
      </div>
    </div>
  );
}

export default Dashboard;