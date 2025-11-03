const express = require('express');
const Scan = require('../models/Scan');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get recent scans (authenticated users)
router.get('/', requireAuth, async (req, res) => {
  try {
    // allow only authenticated users to access audit logs
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    // simple filter: if admin-like roles are present later we can expand
    const scans = await Scan.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(scans);
  } catch (err) {
    console.error('Error fetching scans:', err);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

module.exports = router;
