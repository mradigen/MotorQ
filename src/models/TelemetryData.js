import BaseModel from './BaseModel.js';

class TelemetryData extends BaseModel {
  static get tableName() {
    return 'telemetry_data';
  }

  static async createForVehicle(vehicleId, telemetryData) {
    const {
      latitude,
      longitude,
      speed,
      engine_status,
      fuel_level,
      odometer,
      diagnostic_codes,
      timestamp
    } = telemetryData;

    return await this.create({
      vehicle_id: vehicleId,
      latitude,
      longitude,
      speed,
      engine_status,
      fuel_level,
      odometer,
      diagnostic_codes: diagnostic_codes || null,
      timestamp: timestamp || new Date(),
      created_at: new Date()
    });
  }

  static async findByVehicleId(vehicleId, limit = 100) {
    return await this.db(this.tableName)
      .where('vehicle_id', vehicleId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }

  static async findLatestByVehicleId(vehicleId) {
    return await this.db(this.tableName)
      .where('vehicle_id', vehicleId)
      .orderBy('timestamp', 'desc')
      .first();
  }

  static async findByFleetId(fleetId, limit = 1000) {
    return await this.db(this.tableName)
      .join('vehicles', 'telemetry_data.vehicle_id', 'vehicles.id')
      .where('vehicles.fleet_id', fleetId)
      .select('telemetry_data.*', 'vehicles.vin')
      .orderBy('telemetry_data.timestamp', 'desc')
      .limit(limit);
  }

  static async findRecentByVehicleId(vehicleId, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await this.db(this.tableName)
      .where('vehicle_id', vehicleId)
      .where('timestamp', '>=', cutoffTime)
      .orderBy('timestamp', 'desc');
  }

  static async getAverageFuelLevelForFleet(fleetId, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const result = await this.db(this.tableName)
      .join('vehicles', 'telemetry_data.vehicle_id', 'vehicles.id')
      .where('vehicles.fleet_id', fleetId)
      .where('telemetry_data.timestamp', '>=', cutoffTime)
      .avg('telemetry_data.fuel_level as avg_fuel')
      .first();

    return result?.avg_fuel || 0;
  }

  static async getTotalDistanceForFleet(fleetId, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get the latest odometer reading for each vehicle in the fleet
    const latestReadings = await this.db(this.tableName)
      .join('vehicles', 'telemetry_data.vehicle_id', 'vehicles.id')
      .where('vehicles.fleet_id', fleetId)
      .select('vehicles.id', this.db.raw('MAX(telemetry_data.odometer) as latest_odometer'))
      .groupBy('vehicles.id');

    // Get the earliest odometer reading within the time period for each vehicle
    const earliestReadings = await this.db(this.tableName)
      .join('vehicles', 'telemetry_data.vehicle_id', 'vehicles.id')
      .where('vehicles.fleet_id', fleetId)
      .where('telemetry_data.timestamp', '>=', cutoffTime)
      .select('vehicles.id', this.db.raw('MIN(telemetry_data.odometer) as earliest_odometer'))
      .groupBy('vehicles.id');

    let totalDistance = 0;
    for (const latest of latestReadings) {
      const earliest = earliestReadings.find(e => e.id === latest.id);
      if (earliest) {
        totalDistance += latest.latest_odometer - earliest.earliest_odometer;
      }
    }

    return totalDistance;
  }
}

export default TelemetryData;
