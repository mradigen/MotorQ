import express from 'express';
import { Alert, Vehicle, Fleet } from '../storage/index.js';

const router = express.Router();

router.get('/history/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const alerts = await Alert.findByVehicleId(vehicle.id, limit);
        res.json(alerts);
    } catch (error) {
        console.error('Error getting alert history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/summary/:vin', async (req, res) => {
    try {
        const { vin } = req.params;

        const vehicle = await Vehicle.findByVin(vin);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const alerts = await Alert.findByVehicleId(vehicle.id);

        const summary = {
            high_speed: [],
            low_fuel: [],
            high: [],
            medium: [],
            low: []
        };

        for (const alert of alerts) {
            // Group by violation type
            if (alert.violation_type === 'Overspeeding') {
                summary.high_speed.push(alert);
            } else if (alert.violation_type === 'Low Fuel') {
                summary.low_fuel.push(alert);
            }

            // Group by severity
            if (alert.severity >= 4) {
                summary.high.push(alert);
            } else if (alert.severity >= 2) {
                summary.medium.push(alert);
            } else {
                summary.low.push(alert);
            }
        }

        res.json(summary);
    } catch (error) {
        console.error('Error getting alert summary:', error);
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

        const latestAlert = await Alert.getLatestAlertForVehicle(vehicle.id);
        if (!latestAlert) {
            return res.status(404).json({ error: 'No alerts found for this vehicle' });
        }

        res.json(latestAlert);
    } catch (error) {
        console.error('Error getting latest alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/history/id/:alert_id', async (req, res) => {
    try {
        const { alert_id } = req.params;

        const alert = await Alert.findAll({ alert_id });
        if (!alert || alert.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alert[0]);
    } catch (error) {
        console.error('Error getting alert by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alerts for a fleet
router.get('/fleet/:fleet_id', async (req, res) => {
    try {
        const { fleet_id } = req.params;
        const limit = parseInt(req.query.limit) || 1000;

        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        const alerts = await Alert.findByFleetId(fleet_id, limit);
        res.json(alerts);
    } catch (error) {
        console.error('Error getting fleet alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alerts by type
router.get('/type/:violation_type', async (req, res) => {
    try {
        const { violation_type } = req.params;
        const vehicleId = req.query.vehicle_id;

        const alerts = await Alert.findByViolationType(violation_type, vehicleId);
        res.json(alerts);
    } catch (error) {
        console.error('Error getting alerts by type:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alerts by severity
router.get('/severity/:min_severity', async (req, res) => {
    try {
        const { min_severity } = req.params;
        const vehicleId = req.query.vehicle_id;

        const alerts = await Alert.findBySeverity(parseInt(min_severity), vehicleId);
        res.json(alerts);
    } catch (error) {
        console.error('Error getting alerts by severity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alert statistics
router.get('/stats/fleet/:fleet_id', async (req, res) => {
    try {
        const { fleet_id } = req.params;
        const hours = parseInt(req.query.hours) || 24;

        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        const alertCountsByType = await Alert.getAlertCountByType(fleet_id, hours);
        const alertCountsBySeverity = await Alert.getAlertCountBySeverity(fleet_id, hours);

        res.json({
            time_period_hours: hours,
            alerts_by_type: alertCountsByType,
            alerts_by_severity: alertCountsBySeverity,
            total_alerts: alertCountsByType.reduce((total, count) => total + parseInt(count.count), 0)
        });
    } catch (error) {
        console.error('Error getting alert statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;