import express from 'express'
import vehicle from './vehicle.js';
import telemetry from './telemetry.js';
import alerts from './alerts.js';
import analytics from './analytics.js';
import { Vehicle } from '../storage/index.js';

const app = express();

app.use(express.json());

app.use("/vehicle", vehicle);
app.use("/telemetry", telemetry);
app.use("/alerts", alerts);
app.use("/analytics", analytics);

// Legacy compatibility endpoint
app.get('/stats/:vin', async (req, res) => {
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