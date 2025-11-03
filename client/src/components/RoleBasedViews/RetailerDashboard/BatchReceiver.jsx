import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BatchReceiver = ({ userId }) => {
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncoming = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/distributions/incoming/${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setIncoming(res.data);
      } catch (err) {
        console.error('Error fetching incoming distributions', err);
        alert('Failed to fetch incoming distributions');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchIncoming();
  }, [userId]);

  const handleReceive = async (distributionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://localhost:5000/api/distributions/receive/${distributionId}`, { receiverId: userId }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      alert('Marked as received');
      // refresh
      const refreshed = await axios.get(`http://localhost:5000/api/distributions/incoming/${userId}`);
      setIncoming(refreshed.data);
    } catch (err) {
      console.error('Error marking received', err);
      alert(err.response?.data?.error || 'Failed to mark received');
    }
  };

  if (loading) return <p>Loading incoming shipments...</p>;

  return (
    <div className="batch-receiver">
      <h3>Incoming Shipments</h3>
      {incoming.length === 0 ? (
        <p>No incoming shipments.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Distribution ID</th>
              <th>Batch ID</th>
              <th>Medicine</th>
              <th>Boxes</th>
              <th>From</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {incoming.map(d => (
              <tr key={d.distributionId}>
                <td>{d.distributionId}</td>
                <td>{d.batchId}</td>
                <td>{d.medicineName}</td>
                <td>{d.bigBoxCount}</td>
                <td>{d.senderId}</td>
                <td>{d.status}</td>
                <td>
                  {d.status !== 'delivered' && <button onClick={() => handleReceive(d.distributionId)}>Mark Received</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BatchReceiver;
