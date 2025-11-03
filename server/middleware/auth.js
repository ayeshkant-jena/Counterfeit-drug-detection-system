const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return next(); // allow anonymous access (handlers decide)

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return next();

    const user = await User.findById(decoded.id).lean();
    if (!user) return next();

    req.user = { id: user._id.toString(), role: user.role, name: user.name, walletAddress: user.walletAddress };
    return next();
  } catch (err) {
    console.warn('Auth middleware error:', err.message);
    return next();
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
