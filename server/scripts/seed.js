const mongoose = require('mongoose');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Distribution = require('../models/Distribution');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/medchain');
  console.log('Connected to MongoDB');

  // Create test users with roles matching frontend
  const password = await bcrypt.hash('password123', 10);
  const manufacturer = await User.findOneAndUpdate(
    { email: 'manu@example.com' },
    { 
      name: 'Test Manufacturer', 
      email: 'manu@example.com', 
      password,
      role: 'Manufacturer',
      walletAddress: '0xmanu'.toLowerCase(),
      licenseNumber: 'MANU123',
      companyAddress: '123 Manufacturer St',
      phone: '+1234567890',
      isApproved: true 
    },
    { upsert: true, new: true }
  );

  const wholesaler = await User.findOneAndUpdate(
    { email: 'wholesaler@example.com' },
    { 
      name: 'Test Wholesaler', 
      email: 'wholesaler@example.com', 
      password,
      role: 'Wholesaler', // Matches the frontend role name
      walletAddress: '0xwholesaler'.toLowerCase(),
      licenseNumber: 'WHSL123',
      companyAddress: '456 Wholesaler Ave',
      phone: '+1987654321',
      isApproved: true 
    },
    { upsert: true, new: true }
  );

  const retailer = await User.findOneAndUpdate(
    { email: 'retailer@example.com' },
    { name: 'Test Retailer', email: 'retailer@example.com', password, role: 'Retailer', walletAddress: '0xretailer'.toLowerCase(), isApproved: true },
    { upsert: true, new: true }
  );

  // create a sample batch
  const batch = await Batch.findOneAndUpdate(
    { batchId: 'SAMPLE-BATCH-001' },
    {
      batchId: 'SAMPLE-BATCH-001',
      medicineName: 'SampleMed 100mg',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      bigCartonCount: 2,
      bigBoxPerCarton: 10,
      smallBoxPerBigBox: 5,
      stripsPerSmallBox: 10,
      createdBy: manufacturer._id.toString(),
    },
    { upsert: true, new: true }
  );

  console.log('Seed complete:', { manufacturer: manufacturer.email, wholesaler: wholesaler.email, retailer: retailer.email, batch: batch.batchId });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
