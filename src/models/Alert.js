import BaseModel from './BaseModel.js';

class Alert extends BaseModel {
  static get tableName() {
    return 'alerts';
  }

  static async createForVehicle(vehicleId, alertData) {
    const {
      alert_id,
      violation_type,
      severity,
      description,
      telemetry_data,
      timestamp
    } = alertData;

    return await this.create({
      alert_id,
      vehicle_id: vehicleId,
      violation_type,
      severity,
      description,
      telemetry_data: JSON.stringify(telemetry_data),
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

  static async findByFleetId(fleetId, limit = 1000) {
    return await this.db(this.tableName)
      .join('vehicles', 'alerts.vehicle_id', 'vehicles.id')
      .where('vehicles.fleet_id', fleetId)
      .select('alerts.*', 'vehicles.vin')
      .orderBy('alerts.timestamp', 'desc')
      .limit(limit);
  }

  static async findByViolationType(violationType, vehicleId = null) {
    let query = this.db(this.tableName)
      .where('violation_type', violationType);
    
    if (vehicleId) {
      query = query.where('vehicle_id', vehicleId);
    }
    
    return await query.orderBy('timestamp', 'desc');
  }

  static async findBySeverity(severity, vehicleId = null) {
    let query = this.db(this.tableName)
      .where('severity', '>=', severity);
    
    if (vehicleId) {
      query = query.where('vehicle_id', vehicleId);
    }
    
    return await query.orderBy('timestamp', 'desc');
  }

  static async getAlertCountByType(fleetId = null, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let query = this.db(this.tableName)
      .select('violation_type')
      .count('* as count')
      .where('timestamp', '>=', cutoffTime)
      .groupBy('violation_type');

    if (fleetId) {
      query = query
        .join('vehicles', 'alerts.vehicle_id', 'vehicles.id')
        .where('vehicles.fleet_id', fleetId);
    }

    return await query;
  }

  static async getAlertCountBySeverity(fleetId = null, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let query = this.db(this.tableName)
      .select('severity')
      .count('* as count')
      .where('timestamp', '>=', cutoffTime)
      .groupBy('severity');

    if (fleetId) {
      query = query
        .join('vehicles', 'alerts.vehicle_id', 'vehicles.id')
        .where('vehicles.fleet_id', fleetId);
    }

    return await query;
  }

  static async getLatestAlertForVehicle(vehicleId) {
    return await this.db(this.tableName)
      .where('vehicle_id', vehicleId)
      .orderBy('timestamp', 'desc')
      .first();
  }

  static async findRecentSimilarAlert(vehicleId, violationType, minutes = 5) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return await this.db(this.tableName)
      .where('vehicle_id', vehicleId)
      .where('violation_type', violationType)
      .where('timestamp', '>=', cutoffTime)
      .orderBy('timestamp', 'desc')
      .first();
  }
}

export default Alert;
