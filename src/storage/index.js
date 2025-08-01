// Database models
import Vehicle from '../models/Vehicle.js';
import Fleet from '../models/Fleet.js';
import TelemetryData from '../models/TelemetryData.js';
import Alert from '../models/Alert.js';
import FleetAnalytics from '../models/FleetAnalytics.js';

// Export models for use in API routes and helpers
export {
  Vehicle,
  Fleet,
  TelemetryData,
  Alert,
  FleetAnalytics
};

// Legacy compatibility - remove these once all files are updated
export const db = {
  get: async (vin) => {
    const vehicle = await Vehicle.findByVinWithTelemetryHistory(vin);
    if (!vehicle) return null;
    
    const alerts = await Alert.findByVehicleId(vehicle.id);
    return {
      metadata: {
        vin: vehicle.vin,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        fleet: vehicle.fleet_id,
        owner: vehicle.owner,
        registration_status: vehicle.registration_status
      },
      telemetry: vehicle.telemetry_history || [],
      alerts: alerts || []
    };
  },
  
  create: async (vin, data) => {
    try {
      const existing = await Vehicle.findByVin(vin);
      if (existing) return "VIN Exists";
      
      await Vehicle.createWithMetadata({
        vin,
        ...data.metadata
      });
      return null;
    } catch (error) {
      return error.message;
    }
  },
  
  set: async (vin, data) => {
    try {
      const vehicle = await Vehicle.findByVin(vin);
      if (!vehicle) return "Not found";
      
      // This is mainly for legacy compatibility
      return null;
    } catch (error) {
      return error.message;
    }
  },
  
  delete: async (vin) => {
    const vehicle = await Vehicle.findByVin(vin);
    if (vehicle) {
      await Vehicle.delete(vehicle.id);
    }
  },
  
  list: async () => {
    const vehicles = await Vehicle.findAll();
    return vehicles.map(v => v.vin);
  }
};

export const fleet_db = {
  get: async (fleetId) => {
    const fleet = await Fleet.findByIdWithVehicles(fleetId);
    if (!fleet) return null;
    
    const analytics = await FleetAnalytics.findLatestByFleetId(fleetId);
    return {
      ...fleet,
      vehicles: fleet.vehicles?.map(v => v.vin) || [],
      analytics: analytics || {}
    };
  },
  
  create: async (fleetId, data) => {
    try {
      const existing = await Fleet.findById(fleetId);
      if (existing) return "Fleet Exists";
      
      await Fleet.create({
        id: fleetId,
        name: data.name || `Fleet ${fleetId}`,
        ...data
      });
      return null;
    } catch (error) {
      return error.message;
    }
  },
  
  set: async (fleetId, data) => {
    try {
      const fleet = await Fleet.findById(fleetId);
      if (!fleet) return "Not found";
      
      if (data.analytics) {
        await FleetAnalytics.updateOrCreateLatest(fleetId, data.analytics);
      }
      
      return null;
    } catch (error) {
      return error.message;
    }
  },
  
  list: async () => {
    const fleets = await Fleet.findAll();
    return fleets.map(f => f.id);
  }
};

export const alert_db = {
  get: async (alertId) => {
    const alert = await Alert.findAll({ alert_id: alertId });
    return alert.length > 0 ? alert[0] : null;
  },
  
  create: async (alertId, data) => {
    try {
      await Alert.create({
        alert_id: alertId,
        vehicle_id: data.vehicle_id,
        violation_type: data.violation || data.violation_type,
        severity: data.severity,
        description: data.description,
        telemetry_data: JSON.stringify(data.data || data.telemetry_data),
        timestamp: new Date(data.timestamp),
        created_at: new Date()
      });
      return null;
    } catch (error) {
      return error.message;
    }
  }
};