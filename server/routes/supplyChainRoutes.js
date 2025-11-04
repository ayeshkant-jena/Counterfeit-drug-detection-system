const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const SupplyChainEvent = require('../models/SupplyChainEvent');
const Distribution = require('../models/Distribution');
const Batch = require('../models/Batch');

// Get all events for a batch
router.get('/batch/:batchId', async (req, res) => {
    try {
        const events = await SupplyChainEvent.find({ batchId: req.params.batchId })
            .sort({ timestamp: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch supply chain events' });
    }
});

// Add a new supply chain event (requires authentication)
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            batchId,
            eventType,
            location,
            details,
            distributionId
        } = req.body;

        // Check user authentication
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify batch exists
        const batch = await Batch.findOne({ batchId });
        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        // Get the previous event if exists
        const previousEvent = await SupplyChainEvent.findOne({ batchId })
            .sort({ timestamp: -1 });

        const newEvent = new SupplyChainEvent({
            batchId,
            eventType,
            location,
            details,
            distributionId,
            performedBy: {
                userId: req.user.id,
                role: req.user.role,
                name: req.user.name
            },
            previousEventId: previousEvent ? previousEvent._id : null
        });

        await newEvent.save();

        // If this is a distribution-related event, update the distribution status
        if (distributionId) {
            const distribution = await Distribution.findOne({ distributionId });
            if (distribution) {
                if (eventType === 'SHIPPED_TO_DISTRIBUTOR' || eventType === 'SHIPPED_TO_RETAILER') {
                    distribution.status = 'in-transit';
                } else if (eventType === 'RECEIVED_BY_DISTRIBUTOR' || eventType === 'RECEIVED_BY_RETAILER') {
                    distribution.status = 'delivered';
                }
                await distribution.save();
            }
        }

        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Supply chain event creation error:', err);
        res.status(500).json({ error: 'Failed to create supply chain event' });
    }
});

// Get supply chain statistics
router.get('/stats', requireAuth, requireRole(['Admin', 'Manufacturer']), async (req, res) => {
    try {
        const stats = await SupplyChainEvent.aggregate([
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    averageTime: {
                        $avg: {
                            $subtract: [
                                '$timestamp',
                                { $first: '$timestamp' }
                            ]
                        }
                    }
                }
            }
        ]);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch supply chain statistics' });
    }
});

module.exports = router;