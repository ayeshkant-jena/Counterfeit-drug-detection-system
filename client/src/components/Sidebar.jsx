// src/components/Sidebar.jsx
 const Sidebar = ({ role }) => {
  return (
    <div className="w-60 bg-gray-800 text-white p-4">
      <h2 className="text-lg font-bold mb-4 capitalize">{role} Panel</h2>
      <ul>
        <li className="mb-2">🏠 Dashboard</li>
        <li className="mb-2">📦 Batches</li>
        <li className="mb-2">🔄 Transactions</li>
        <li className="mb-2">👤 Profile</li>
      </ul>
    </div>
  );
}

export default Sidebar;