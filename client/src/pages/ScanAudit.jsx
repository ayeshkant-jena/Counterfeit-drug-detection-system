import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ScanAudit = () => {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/scans', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setScans(res.data);
      } catch (err) {
        console.error('Error fetching scans', err);
        alert('Failed to fetch scans (ensure you are logged in)');
      }
    };
    fetchScans();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Scan Audit (recent)</h2>
      {scans.length === 0 ? <p>No scans yet</p> : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Role</th>
              <th>Actor</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {scans.map(s => (
              <tr key={s.scanId}>
                <td>{s.scanId}</td>
                <td>{s.entityType}</td>
                <td>{s.entityId}</td>
                <td>{s.role}</td>
                <td>{s.actorId}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ScanAudit;
