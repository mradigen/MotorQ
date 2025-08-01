import BaseModel from './BaseModel.js';

class FleetAnalytics extends BaseModel {
  static get tableName() {
    return 'fleet_analytics';
  }

  static async createAnalytics(fleetId, analyticsData) {
    const {
      total_vehicles,
      active_vehicles,
      inactive_vehicles,
      average_fuel_level,
      total_distance_24h,
      alert_count,
      alert_count_severe
    } = analyticsData;

    return await this.create({
      fleet_id: fleetId,
      total_vehicles,
      active_vehicles,
      inactive_vehicles,
      average_fuel_level,
      total_distance_24h,
      alert_count,
      alert_count_severe,
      created_at: new Date()
    });
  }

  static async findLatestByFleetId(fleetId) {
    return await this.db(this.tableName)
      .where('fleet_id', fleetId)
      .orderBy('created_at', 'desc')
      .first();
  }

  static async findByFleetIdAndDateRange(fleetId, startDate, endDate) {
    return await this.db(this.tableName)
      .where('fleet_id', fleetId)
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc');
  }

  static async updateOrCreateLatest(fleetId, analyticsData) {
    const existing = await this.findLatestByFleetId(fleetId);
    const today = new Date().toDateString();
    
    if (existing && new Date(existing.created_at).toDateString() === today) {
      // Update today's record
      return await this.update(existing.id, analyticsData);
    } else {
      // Create new record
      return await this.createAnalytics(fleetId, analyticsData);
    }
  }
}

export default FleetAnalytics;
