import config from "../config/index.js";
import { Fleet, Vehicle, TelemetryData, Alert, FleetAnalytics } from "../storage/index.js";

export async function consolidateAnalytics() {
    try {
        const fleets = await Fleet.findAll();
        
        for (const fleet of fleets) {
            await calculateFleetAnalytics(fleet.id);
        }
        
        console.log("Analytics consolidation complete");
    } catch (error) {
        console.error("Error consolidating analytics:", error);
    }
}

async function calculateFleetAnalytics(fleetId) {
    try {
        // Get all vehicles in the fleet
        const vehicles = await Vehicle.findByFleetId(fleetId);
        
        // Calculate analytics
        const analytics = {
            total_vehicles: vehicles.length,
            active_vehicles: 0,
            inactive_vehicles: 0,
            average_fuel_level: 0,
            total_distance_24h: 0,
            alert_count: 0,
            alert_count_severe: 0
        };

        // Calculate active/inactive vehicles
        const activeVehicles = await Vehicle.findActiveVehicles();
        const activeVehicleIds = new Set(activeVehicles.map(v => v.id));
        
        analytics.active_vehicles = vehicles.filter(v => activeVehicleIds.has(v.id)).length;
        analytics.inactive_vehicles = analytics.total_vehicles - analytics.active_vehicles;

        // Calculate average fuel level for the fleet
        analytics.average_fuel_level = await TelemetryData.getAverageFuelLevelForFleet(fleetId, 24);

        // Calculate total distance traveled in last 24 hours
        analytics.total_distance_24h = await TelemetryData.getTotalDistanceForFleet(fleetId, 24);

        // Calculate alert counts
        const alertCounts = await Alert.getAlertCountBySeverity(fleetId, 24);
        analytics.alert_count = alertCounts.reduce((total, count) => total + parseInt(count.count), 0);
        analytics.alert_count_severe = alertCounts
            .filter(count => count.severity >= 3)
            .reduce((total, count) => total + parseInt(count.count), 0);

        // Save analytics
        await FleetAnalytics.updateOrCreateLatest(fleetId, analytics);
        
        console.log(`Analytics updated for fleet ${fleetId}:`, analytics);
    } catch (error) {
        console.error(`Error calculating analytics for fleet ${fleetId}:`, error);
    }
}

export default {
    analytics: setInterval(consolidateAnalytics, config.analytics.bufferInterval * 1000),
};