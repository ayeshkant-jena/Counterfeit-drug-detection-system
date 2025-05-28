import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './Login';
import Dashboard from './pages/Dashboard';
import Login from '../src/pages/Login'
import LandingPage from './pages/landingPage';
import Navbar from './components/Navbar/navbar';
import VerifyMedicine from './pages/VerifyMedicine'
import ReportMedicine from './pages/ReportMedicine';
import MedicineSupplyDetail from './pages/MedicineSupplyDetail';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verifymedicine" element={<VerifyMedicine />} />
        <Route path="/reportmedicine" element={<ReportMedicine />} />
        <Route path="/medicinesupplydetail" element={<MedicineSupplyDetail />} />
      </Routes>
    </Router>
  );
}

export default App;