import express from 'express';
import { Vehicle, TelemetryData, Fleet } from '../storage/index.js';
import { checkAlerts } from '../helpers/alerts.js';
import { incrementTelemetryReceived } from '../monitoring/prometheus.js';

const router = express.Router();

router.get('/history/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const telemetryHistory = await TelemetryData.findByVehicleId(vehicle.id, limit);
        res.json(telemetryHistory);
    } catch (error) {
        console.error('Error getting telemetry history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/latest/:vin', async (req, res) => {
    try {
        const { vin } = req.params;

        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const latestTelemetry = await TelemetryData.findLatestByVehicleId(vehicle.id);
        if (!latestTelemetry) {
            return res.status(404).json({ error: 'No telemetry data found for this vehicle' });
        }

        res.json(latestTelemetry);
    } catch (error) {
        console.error('Error getting latest telemetry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/history/fleet/:fleet_id', async (req, res) => {
    try {
        const { fleet_id } = req.params;
        const limit = parseInt(req.query.limit) || 1000;

        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        const telemetryData = await TelemetryData.findByFleetId(fleet_id, limit);
        res.json(telemetryData);
    } catch (error) {
        console.error('Error getting fleet telemetry history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/*
{
    "latitude": 34.5,
    "longitude": 34.5,
    "speed": 23,
    "engine_status": "On",
    "fuel_level": 0.34,
    "odometer": 30000,
    "diagnostic_codes": "34", 
    "timestamp": 1648342948200
}
*/
router.post('/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        const telemetryData = req.body;

        const requiredFields = ['latitude', 'longitude', 'speed', 'engine_status', 'fuel_level', 'odometer'];
        for (const field of requiredFields) {
            if (telemetryData[field] === undefined || telemetryData[field] === null) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (!telemetryData.timestamp) {
            telemetryData.timestamp = new Date();
        }

        const telemetry = await TelemetryData.createForVehicle(vehicle.id, {
            latitude: telemetryData.latitude || telemetryData.lat,
            longitude: telemetryData.longitude || telemetryData.lon,
            speed: telemetryData.speed,
            engine_status: telemetryData.engine_status,
            fuel_level: telemetryData.fuel_level || telemetryData.fuel,
            odometer: telemetryData.odometer,
            diagnostic_codes: telemetryData.diagnostic_codes || telemetryData.debug,
            timestamp: telemetryData.timestamp
        });

        await checkAlerts(vin, telemetryData);

        incrementTelemetryReceived(vin, vehicle.fleet_id);

        res.status(201).json({
            message: 'Telemetry data received successfully',
            telemetry_id: telemetry.id
        });
    } catch (error) {
        console.error('Error processing telemetry data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/bulk', async (req, res) => {
    try {
        const { telemetry_data } = req.body;

        if (!Array.isArray(telemetry_data)) {
            return res.status(400).json({ error: 'telemetry_data must be an array' });
        }

        const results = [];
        const errors = [];

        for (const data of telemetry_data) {
            try {
                const { vin, ...telemetryInfo } = data;
                
                const vehicle = await Vehicle.findByVin(vin);
                if (!vehicle) {
                    errors.push({ vin, error: 'Vehicle not found' });
                    continue;
                }

                if (!telemetryInfo.timestamp) {
                    telemetryInfo.timestamp = new Date();
                }

                const telemetry = await TelemetryData.createForVehicle(vehicle.id, {
                    latitude: telemetryInfo.latitude || telemetryInfo.lat,
                    longitude: telemetryInfo.longitude || telemetryInfo.lon,
                    speed: telemetryInfo.speed,
                    engine_status: telemetryInfo.engine_status,
                    fuel_level: telemetryInfo.fuel_level || telemetryInfo.fuel,
                    odometer: telemetryInfo.odometer,
                    diagnostic_codes: telemetryInfo.diagnostic_codes || telemetryInfo.debug,
                    timestamp: telemetryInfo.timestamp
                });

                await checkAlerts(vin, telemetryInfo);

                results.push({ vin, telemetry_id: telemetry.id, status: 'success' });
            } catch (error) {
                errors.push({ vin: data.vin, error: error.message });
            }
        }

        res.status(201).json({
            message: 'Bulk telemetry processing completed',
            successful: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error processing bulk telemetry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;