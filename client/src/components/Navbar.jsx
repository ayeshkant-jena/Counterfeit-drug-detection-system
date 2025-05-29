// src/components/Navbar.jsx
const Navbar = ({ username, role }) => {
  return (
    <div className="bg-white border-b p-4 shadow flex justify-between">
      <span className="font-semibold text-lg">Counterfeit Drug Detection</span>
      <div>
        <span className="mr-4 capitalize">{role}</span>
        <span className="font-bold">{username}</span>
      </div>
    </div>
  );
}

export default Navbar;