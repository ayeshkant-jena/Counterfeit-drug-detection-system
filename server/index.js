const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/medchain');

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Batch routes
const batchRoutes = require('./routes/batchRoutes');
app.use('/api/batches', batchRoutes);

// QR routes
const qrRoutes = require('./routes/qrCode');
app.use('/api', qrRoutes); // Mounts /api/qrcodes and /api/scan-qr

// Serve QR code images
app.use('/qrcodes', express.static(path.join(__dirname, 'public', 'qrcodes')));
app.use('/scan-qr', express.static(path.join(__dirname, 'public', 'scn-qr')));

app.listen(5000, () => console.log('Server running on port 5000'));
