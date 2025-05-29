// import { useEffect, useState } from 'react';
// import axios from 'axios';

// export default function Dashboard() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     axios.get('http://localhost:5000/user', { withCredentials: true })
//       .then((res) => setUser(res.data))
//       .catch((err) => console.log(err));
//   }, []);

//   return (
//     <div style={{ textAlign: 'center', marginTop: '100px' }}>
//       <h2>Dashboard</h2>
//       {user ? (
//         <>
//           <p>Welcome, {user.displayName}</p>
//           <img src={user.photos[0].value} alt="Profile" width={100} />
//           <br />
//           <a href="http://localhost:5000/logout">
//             <button>Logout</button>
//           </a>
//         </>
//       ) : (
//         <p>Loading user...</p>
//       )}
//     </div>
//   );
// }
// src/pages/DashboardPage.jsx
import Dashboard from "../components/Dashboard";

const DashboardPage = () => {
  return(
    <Dashboard />
  )
}

export default DashboardPage;