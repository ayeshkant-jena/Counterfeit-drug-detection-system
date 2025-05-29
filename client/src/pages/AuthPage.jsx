import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- Step 1

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    walletAddress: '',
    licenseNumber: '',
    companyAddress: ''
  });

  const navigate = useNavigate(); // <-- Step 2

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      walletAddress: '',
      licenseNumber: '',
      companyAddress: ''
    });
    setWalletConnected(false);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];
        setForm(prev => ({ ...prev, walletAddress }));
        setWalletConnected(true);
        alert(`Wallet connected: ${walletAddress}`);
      } catch (err) {
        console.error("Wallet connection failed", err);
        alert("Wallet connection was rejected");
      }
    } else {
      alert("MetaMask is not installed");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: form.email,
          password: form.password
        });
        alert(`Logged in as ${res.data.role}`);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data)); // optional: store user
        navigate("/dashboard"); // <-- Step 3: redirect to dashboard
      } else {
        if (!walletConnected) {
          return alert("Please connect your MetaMask wallet first.");
        }
        await axios.post('http://localhost:5000/api/auth/register', form);
        alert('Registered successfully. Await admin approval.');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input type="text" name="name" placeholder="Company Name" onChange={handleChange} value={form.name} required />
            <input type="text" name="phone" placeholder="Phone" onChange={handleChange} value={form.phone} required />
            <select name="role" onChange={handleChange} value={form.role} required>
              <option value="">Select Role</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Distributor">Distributor</option>
              <option value="Retailer">Retailer</option>
            </select>
            <input type="text" name="licenseNumber" placeholder="License Number" onChange={handleChange} value={form.licenseNumber} />
            <input type="text" name="companyAddress" placeholder="Company Address" onChange={handleChange} value={form.companyAddress} />
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" onClick={connectWallet}>
                {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </button>
              {form.walletAddress && (
                <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{form.walletAddress}</span>
              )}
            </div>
          </>
        )}

        <input type="email" name="email" placeholder="Email" onChange={handleChange} value={form.email} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} value={form.password} required />
        <button type="submit" style={{ marginTop: 10 }}>{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p style={{ marginTop: 10 }}>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button onClick={toggleForm} style={{ border: 'none', background: 'none', color: 'blue', cursor: 'pointer' }}>
          {isLogin ? 'Register here' : 'Login here'}
        </button>
      </p>
    </div>
  );
}

export default AuthPage;
