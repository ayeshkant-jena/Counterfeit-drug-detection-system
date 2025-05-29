// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ManufacturerView from "./RoleBasedViews/ManufacturerView";
import DistributorView from "./RoleBasedViews/DistributorView";
import RetailerView from "./RoleBasedViews/RetailerView";

 const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulated JWT decoding or fetch from backend
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      <Sidebar role={user.role} />
      <div className="flex flex-col flex-grow">
        <Navbar username={user.name} role={user.role} />
        <div className="p-4 flex-grow overflow-y-auto">
          {user.role === "manufacturer" && <ManufacturerView />}
          {user.role === "distributor" && <DistributorView />}
          {user.role === "retailer" && <RetailerView />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;