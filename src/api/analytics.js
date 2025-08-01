import express from 'express';
import { Fleet, FleetAnalytics, Vehicle, TelemetryData, Alert } from '../storage/index.js';
import { consolidateAnalytics } from '../helpers/analytics.js';

const router = express.Router();

router.get('/:fleet_id', async (req, res) => {
    try {
        const { fleet_id } = req.params;
        const forceRefresh = req.query.refresh === 'true';

        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        let analytics;
        
        if (forceRefresh) {
            // Force refresh analytics
            await consolidateAnalytics();
            analytics = await FleetAnalytics.findLatestByFleetId(fleet_id);
        } else {
            // Get latest analytics
            analytics = await FleetAnalytics.findLatestByFleetId(fleet_id);
            
            // If no analytics found or data is older than 1 hour, refresh
            if (!analytics || (new Date() - new Date(analytics.created_at)) > 60 * 60 * 1000) {
                await consolidateAnalytics();
                analytics = await FleetAnalytics.findLatestByFleetId(fleet_id);
            }
        }

        res.json({
            fleet_id: fleet_id,
            fleet_name: fleet.name,
            analytics: analytics || {},
            last_updated: analytics?.created_at
        });
    } catch (error) {
        console.error('Error getting fleet analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get analytics for all fleets
router.get('/', async (req, res) => {
    try {
        const fleets = await Fleet.findAll();
        const analyticsData = [];

        for (const fleet of fleets) {
            const analytics = await FleetAnalytics.findLatestByFleetId(fleet.id);
            analyticsData.push({
                fleet_id: fleet.id,
                fleet_name: fleet.name,
                fleet_type: fleet.type,
                analytics: analytics || {},
                last_updated: analytics?.created_at
            });
        }

        res.json(analyticsData);
    } catch (error) {
        console.error('Error getting all fleet analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get detailed vehicle status for a fleet
router.get('/:fleet_id/vehicles/status', async (req, res) => {
    try {
        const { fleet_id } = req.params;

        const fleet = await Fleet.findById(fleet_id);
        if (!fleet) {
            return res.status(404).json({ error: 'Fleet not found' });
        }

        const vehicles = await Vehicle.findByFleetId(fleet_id);
        const activeVehicles = await Vehicle.findActiveVehicles();
        const activeVehicleIds = new Set(activeVehicles.map(v => v.id));

        const vehicleStatuses = await Promise.all(vehicles.map(async (vehicle) => {
            const latestTelemetry = await TelemetryData.findLatestByVehicleId(vehicle.id);
            const isActive = activeVehicleIds.has(vehicle.id);
            
            return {
                vin: vehicle.vin,
                manufacturer: vehicle.manufacturer,
                model: vehicle.model,
                registration_status: vehicle.registration_status,
                is_active: isActive,
                latest_telemetry: latestTelemetry,
                last_seen: latestTelemetry?.timestamp
            };
        }));

        res.json({
            fleet_id: fleet_id,
            total_vehicles: vehicleStatuses.length,
            active_vehicles: vehicleStatuses.filter(v => v.is_active).length,
            inactive_vehicles: vehicleStatuses.filter(v => !v.is_active).length,
            vehicles: vehicleStatuses
        });
    } catch (error) {
        console.error('Error getting vehicle status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent alerts summary for a fleet
router.get('/:fleet_id/alerts/summary', async (req, res) => {
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
            fleet_id: fleet_id,
            time_period_hours: hours,
            alerts_by_type: alertCountsByType,
            alerts_by_severity: alertCountsBySeverity,
            total_alerts: alertCountsByType.reduce((total, count) => total + parseInt(count.count), 0)
        });
    } catch (error) {
        console.error('Error getting alerts summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Manual analytics refresh endpoint
router.post('/refresh', async (req, res) => {
    try {
        await consolidateAnalytics();
        res.json({ message: 'Analytics refreshed successfully' });
    } catch (error) {
        console.error('Error refreshing analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;