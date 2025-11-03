import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './Login';
import DashboardPage from './pages/DashboardPage';
import AuthPage from '../src/pages/AuthPage'
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar/Navbar';
import VerifyMedicine from './pages/VerifyMedicine'
import ReportMedicine from './pages/ReportMedicine';
import MedicineSupplyDetail from './pages/MedicineSupplyDetail';
import ScanAudit from './pages/ScanAudit';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/verifymedicine" element={<VerifyMedicine />} />
        <Route path="/reportmedicine" element={<ReportMedicine />} />
        <Route path="/medicinesupplydetail" element={<MedicineSupplyDetail />} />
        <Route path="/scan-audit" element={<ScanAudit />} />
      </Routes>
    </Router>
  );
}

export default App;
