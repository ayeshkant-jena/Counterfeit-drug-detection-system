import { useState } from 'react';
import axios from 'axios';

function RegisterModule() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '', walletAddress: '', licenseNumber: '', companyAddress: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      alert('Registered successfully! Wait for admin approval.');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Company Name" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="phone" placeholder="Phone" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <select name="role" onChange={handleChange} required>
        <option value="">Select Role</option>
        <option value="Manufacturer">Manufacturer</option>
        <option value="Distributor">Distributor</option>
        <option value="Retailer">Retailer</option>
      </select>
      <input name="walletAddress" placeholder="Wallet Address" onChange={handleChange} required />
      <input name="licenseNumber" placeholder="License Number" onChange={handleChange} />
      <input name="companyAddress" placeholder="Company Address" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
}

export default RegisterModule;
