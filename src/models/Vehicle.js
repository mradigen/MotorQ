import BaseModel from './BaseModel.js';

class Vehicle extends BaseModel {
  static get tableName() {
    return 'vehicles';
  }

  static async createWithMetadata(vehicleData) {
    const {
      vin,
      manufacturer,
      model,
      fleet_id,
      owner,
      registration_status
    } = vehicleData;

    return await this.create({
      vin,
      manufacturer,
      model,
      fleet_id,
      owner,
      registration_status,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  static async findByVinWithLatestTelemetry(vin) {
    const vehicle = await this.findByVin(vin);
    if (!vehicle) return null;

    const latestTelemetry = await this.db('telemetry_data')
      .where('vehicle_id', vehicle.id)
      .orderBy('timestamp', 'desc')
      .first();

    return {
      ...vehicle,
      latest_telemetry: latestTelemetry
    };
  }

  static async findByVinWithTelemetryHistory(vin, limit = 100) {
    const vehicle = await this.findByVin(vin);
    if (!vehicle) return null;

    const telemetryHistory = await this.db('telemetry_data')
      .where('vehicle_id', vehicle.id)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return {
      ...vehicle,
      telemetry_history: telemetryHistory
    };
  }

  static async findByVinWithAlerts(vin) {
    const vehicle = await this.findByVin(vin);
    if (!vehicle) return null;

    const alerts = await this.db('alerts')
      .where('vehicle_id', vehicle.id)
      .orderBy('timestamp', 'desc');

    return {
      ...vehicle,
      alerts
    };
  }

  static async findActiveVehicles() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    return await this.db('vehicles')
      .select('vehicles.*')
      .join('telemetry_data', 'vehicles.id', 'telemetry_data.vehicle_id')
      .where('telemetry_data.timestamp', '>=', cutoffTime)
      .andWhere('vehicles.registration_status', 'Active')
      .groupBy('vehicles.id')
      .orderBy('vehicles.created_at', 'desc');
  }

  static async findInactiveVehicles() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const activeVehicleIds = await this.db('telemetry_data')
      .select('vehicle_id')
      .where('timestamp', '>=', cutoffTime)
      .groupBy('vehicle_id');

    const activeIds = activeVehicleIds.map(v => v.vehicle_id);

    return await this.db('vehicles')
      .whereNotIn('id', activeIds)
      .orWhere('registration_status', '!=', 'Active');
  }

  static async findByFleetId(fleetId) {
    return await this.db('vehicles')
      .where('fleet_id', fleetId)
      .orderBy('created_at', 'desc');
  }
}

export default Vehicle;
