import { Vehicle, Alert } from "../storage/index.js";
import config from "../config/index.js";
import { incrementAlertsCreated } from "../monitoring/prometheus.js";

export async function checkAlerts(vin, telemetryData) {
    const vehicle = await Vehicle.findByVin(vin);
    if (!vehicle) {
        console.error(`Vehicle with VIN ${vin} not found`);
        return;
    }

    // Check for speed violations
    await checkSpeedViolations(vehicle.id, telemetryData);
    
    // Check for low fuel alerts
    await checkLowFuelAlerts(vehicle.id, telemetryData);
}

async function checkSpeedViolations(vehicleId, telemetryData) {
    const speedThresholds = config.alerts.highSpeed;
    
    for (let i = 0; i < speedThresholds.length; i++) {
        if (telemetryData.speed > speedThresholds[i]) {
            console.log("HIGH SPEED VIOLATION DETECTED");
            
            // Check if there's a recent similar alert (within 5 minutes)
            const recentAlert = await Alert.findRecentSimilarAlert(vehicleId, 'Overspeeding', 5);
            
            if (!recentAlert) {
                // Create new alert
                const alertId = Math.random().toString(36).substring(2, 15);
                
                await Alert.createForVehicle(vehicleId, {
                    alert_id: alertId,
                    violation_type: 'Overspeeding',
                    severity: i + 1,
                    description: `Vehicle exceeded speed limit: ${telemetryData.speed} km/h (Threshold: ${speedThresholds[i]} km/h)`,
                    telemetry_data: telemetryData,
                    timestamp: new Date(telemetryData.timestamp)
                });
                
                // Track metric
                const vehicle = await Vehicle.findById(vehicleId);
                if (vehicle) {
                    incrementAlertsCreated(vehicle.vin, vehicle.fleet_id, 'Overspeeding', i + 1);
                }
                
                console.log(`Speed violation alert created for vehicle ID ${vehicleId}`);
            } else {
                // Update existing alert severity
                await Alert.update(recentAlert.id, {
                    severity: recentAlert.severity + (i + 1),
                    updated_at: new Date()
                });
                
                console.log(`Speed violation alert updated for vehicle ID ${vehicleId}`);
            }
            break;
        }
    }
}

async function checkLowFuelAlerts(vehicleId, telemetryData) {
    const fuelThresholds = config.alerts.lowFuel;
    
    for (let i = 0; i < fuelThresholds.length; i++) {
        if (telemetryData.fuel_level < fuelThresholds[i]) {
            console.log("LOW FUEL ALERT DETECTED");
            
            // Check if there's a recent similar alert (within 5 minutes)
            const recentAlert = await Alert.findRecentSimilarAlert(vehicleId, 'Low Fuel', 5);
            
            if (!recentAlert) {
                // Create new alert
                const alertId = Math.random().toString(36).substring(2, 15);
                
                await Alert.createForVehicle(vehicleId, {
                    alert_id: alertId,
                    violation_type: 'Low Fuel',
                    severity: i + 1,
                    description: `Vehicle fuel level is low: ${telemetryData.fuel_level}% (Threshold: ${fuelThresholds[i]}%)`,
                    telemetry_data: telemetryData,
                    timestamp: new Date(telemetryData.timestamp)
                });
                
                // Track metric
                const vehicle = await Vehicle.findById(vehicleId);
                if (vehicle) {
                    incrementAlertsCreated(vehicle.vin, vehicle.fleet_id, 'Low Fuel', i + 1);
                }
                
                console.log(`Low fuel alert created for vehicle ID ${vehicleId}`);
            } else {
                // Update existing alert severity
                await Alert.update(recentAlert.id, {
                    severity: recentAlert.severity + (i + 1),
                    updated_at: new Date()
                });
                
                console.log(`Low fuel alert updated for vehicle ID ${vehicleId}`);
            }
            break;
        }
    }
}