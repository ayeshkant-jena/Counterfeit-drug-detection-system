const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Distribution = require('../models/Distribution');
const User = require('../models/User');
const Batch = require('../models/Batch');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all distributors (wholesalers) - public
router.get('/distributors', async (req, res) => {
    try {
        const distributors = await User.find({ 
            role: 'Wholesaler',
            isApproved: true 
        }).select('_id name email companyAddress walletAddress');
        res.json(distributors);
    } catch (err) {
        console.error('Error fetching distributors:', err);
        res.status(500).json({ error: 'Failed to fetch distributors' });
    }
});

// Get all retailers - public
router.get('/retailers', async (req, res) => {
    try {
        const retailers = await User.find({ role: 'Retailer', isApproved: true }).select('_id name email companyAddress walletAddress');
        res.json(retailers);
    } catch (err) {
        console.error('Error fetching retailers:', err);
        res.status(500).json({ error: 'Failed to fetch retailers' });
    }
});

// Create new distribution
router.post('/create', requireAuth, async (req, res) => {
    // sender must be authenticated; use req.user for sender identity
    const {
        batchId,
        medicineName,
        manufacturerId,
        receiverId,
        receiverRole,
        bigBoxCount,
        expiryDate
    } = req.body;
    const senderId = req.user?.id;
    const senderRole = req.user?.role;

    try {
        // Verify batch exists and has enough boxes
        const batch = await Batch.findOne({ batchId });
        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        const totalBoxes = batch.bigCartonCount * batch.bigBoxPerCarton;

        // compute how many boxes sender currently holds for this batch
        // sender must have previously received boxes (or be the Manufacturer who can send from master stock)
        const receivedBySender = await Distribution.aggregate([
            { $match: { batchId, receiverId: senderId } },
            { $group: { _id: null, sum: { $sum: '$bigBoxCount' } } }
        ]);
        const sentBySender = await Distribution.aggregate([
            { $match: { batchId, senderId: senderId } },
            { $group: { _id: null, sum: { $sum: '$bigBoxCount' } } }
        ]);
        const received = (receivedBySender[0] && receivedBySender[0].sum) || 0;
        const sent = (sentBySender[0] && sentBySender[0].sum) || 0;
        const availableForSender = received - sent;

        if (bigBoxCount > availableForSender) {
            return res.status(400).json({ error: 'Insufficient boxes available for sender', available: availableForSender });
        }

        const distributionId = uuidv4();
        const newDistribution = new Distribution({
            distributionId,
            batchId,
            medicineName,
            manufacturerId,
            senderId,
            senderRole,
            receiverId,
            receiverRole,
            bigBoxCount,
            expiryDate
        });

        await newDistribution.save();

        // append a distribution event into batch's supplyChainHistory indicating a handoff
        try {
            await Batch.findOneAndUpdate(
                { batchId },
                {
                    $push: {
                        supplyChainHistory: {
                            step: 'distributed',
                            role: senderRole,
                            actorId: senderId,
                            details: { distributionId, bigBoxCount, to: receiverId }
                        }
                    }
                }
            );
        } catch (err) {
            console.error('Failed to append distribution to batch history:', err);
        }

        res.status(201).json({ message: 'Distribution created', distributionId });
    } catch (err) {
        console.error('Distribution creation error:', err);
        res.status(500).json({ error: 'Failed to create distribution' });
    }
});

// helper to resolve wallet -> user id
async function resolveToUserId(param) {
    if (typeof param === 'string' && param.toLowerCase().startsWith('0x')) {
        const u = await User.findOne({ walletAddress: param.toLowerCase() }).lean();
        return u ? u._id.toString() : null;
    }
    return param;
}

// Get incoming distributions for a receiver (wholesaler or retailer)
router.get('/incoming/:receiverId', requireAuth, async (req, res) => {
    try {
        // allow only the receiver to fetch their incoming shipments; accept wallet or id
        const param = req.params.receiverId;
        const resolved = await resolveToUserId(param) || param;
        if (req.user?.id !== resolved && req.user?.walletAddress?.toLowerCase() !== (param || '').toLowerCase()) return res.status(403).json({ error: 'Forbidden' });
        const distributions = await Distribution.find({ receiverId: resolved });
        res.json(distributions);
    } catch (err) {
        console.error('Error fetching incoming distributions:', err);
        res.status(500).json({ error: 'Failed to fetch incoming distributions' });
    }
});

// Get sent distributions for a sender
router.get('/sent/:senderId', requireAuth, async (req, res) => {
    try {
        const param = req.params.senderId;
        const resolved = await resolveToUserId(param) || param;
        if (req.user?.id !== resolved && req.user?.walletAddress?.toLowerCase() !== (param || '').toLowerCase()) return res.status(403).json({ error: 'Forbidden' });
        const distributions = await Distribution.find({ senderId: resolved });
        res.json(distributions);
    } catch (err) {
        console.error('Error fetching sent distributions:', err);
        res.status(500).json({ error: 'Failed to fetch sent distributions' });
    }
});

// Get available boxes for a holder (receiver) for a batch
router.get('/available/:holderId/:batchId', requireAuth, async (req, res) => {
    try {
        const { holderId, batchId } = req.params;
        const resolved = await resolveToUserId(holderId) || holderId;
        if (req.user?.id !== resolved && req.user?.walletAddress?.toLowerCase() !== (holderId || '').toLowerCase()) return res.status(403).json({ error: 'Forbidden' });
        const batch = await Batch.findOne({ batchId });
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        const receivedByHolder = await Distribution.aggregate([
            { $match: { batchId, receiverId: resolved } },
            { $group: { _id: null, sum: { $sum: '$bigBoxCount' } } }
        ]);
        const sentByHolder = await Distribution.aggregate([
            { $match: { batchId, senderId: resolved } },
            { $group: { _id: null, sum: { $sum: '$bigBoxCount' } } }
        ]);
        const received = (receivedByHolder[0] && receivedByHolder[0].sum) || 0;
        const sent = (sentByHolder[0] && sentByHolder[0].sum) || 0;
        const available = received - sent;
        res.json({ available });
    } catch (err) {
        console.error('Error computing available boxes:', err);
        res.status(500).json({ error: 'Failed to compute available boxes' });
    }
});

// Mark a distribution as received (delivered) by receiver
router.patch('/receive/:distributionId', requireAuth, async (req, res) => {
    try {
        const { distributionId } = req.params;
        const { receiverId } = req.body;
        const distribution = await Distribution.findOne({ distributionId });
        if (!distribution) return res.status(404).json({ error: 'Distribution not found' });

            if (distribution.receiverId !== receiverId) {
                return res.status(403).json({ error: 'You are not the intended receiver' });
            }

            // allow receiver if their id or wallet matches
            if (req.user?.id !== receiverId && req.user?.walletAddress?.toLowerCase() !== (receiverId || '').toLowerCase()) return res.status(403).json({ error: 'Auth mismatch' });

        distribution.status = 'delivered';
        await distribution.save();

        // append receive event to parent batch history
        try {
            await Batch.findOneAndUpdate(
                { batchId: distribution.batchId },
                { $push: { supplyChainHistory: { step: 'received', role: distribution.receiverRole, actorId: receiverId, details: { distributionId, bigBoxCount: distribution.bigBoxCount }, firstScannedAt: new Date() } }, $set: { } },
                { new: true }
            );
        } catch (err) {
            console.error('Failed to append receive event:', err);
        }

        res.json({ message: 'Distribution marked as received' });
    } catch (err) {
        console.error('Error marking distribution received:', err);
        res.status(500).json({ error: 'Failed to mark received' });
    }
});

// Get distributions by manufacturer
router.get('/by-manufacturer/:manufacturerId', async (req, res) => {
    try {
        const distributions = await Distribution.find({ 
            manufacturerId: req.params.manufacturerId 
        });
        res.json(distributions);
    } catch (err) {
        console.error('Error fetching distributions:', err);
        res.status(500).json({ error: 'Failed to fetch distributions' });
    }
});

module.exports = router;