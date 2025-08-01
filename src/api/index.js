import express from 'express'
import vehicle from './vehicle.js';
import telemetry from './telemetry.js';
import alerts from './alerts.js';
import analytics from './analytics.js';
import admin from './admin.js';
import { Vehicle } from '../storage/index.js';
import { authenticateToken } from '../middleware/auth.js';

const app = express();

app.use(express.json());

// Public routes (no authentication required)
app.use("/telemetry", telemetry);

// Admin routes (separate authentication)
app.use("/admin", admin);

// Protected routes (authentication required)
app.use("/vehicle", authenticateToken, vehicle);
app.use("/alerts", authenticateToken, alerts);
app.use("/analytics", authenticateToken, analytics);

// Legacy compatibility endpoint (protected)
app.get('/stats/:vin', authenticateToken, async (req, res) => {
    try {
        const { vin } = req.params;
        const vehicle = await Vehicle.findByVinWithLatestTelemetry(vin);

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.json({
            vehicle: {
                vin: vehicle.vin,
                manufacturer: vehicle.manufacturer,
                model: vehicle.model,
                fleet_id: vehicle.fleet_id,
                owner: vehicle.owner,
                registration_status: vehicle.registration_status
            },
            latest_telemetry: vehicle.latest_telemetry
        });
    } catch (error) {
        console.error('Error getting vehicle stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(3000, "0.0.0.0", (e) => {
    console.log("API started on port 3000");
})

export default app;