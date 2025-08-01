import express from 'express';
import { register, updateMetrics } from '../monitoring/prometheus.js';

const router = express.Router();

router.get('/metrics', async (req, res) => {
    try {
        await updateMetrics();
        
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        console.error('Error serving metrics:', error);
        res.status(500).json({ error: 'Failed to generate metrics' });
    }
});

router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
