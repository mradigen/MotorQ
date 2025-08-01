import BaseModel from './BaseModel.js';

class Fleet extends BaseModel {
  static get tableName() {
    return 'fleets';
  }

  static async findByIdWithVehicles(fleetId) {
    return await this.db('fleets')
      .leftJoin('vehicles', 'fleets.id', 'vehicles.fleet_id')
      .select(
        'fleets.*',
        this.db.raw('COALESCE(json_agg(json_build_object(\'id\', vehicles.id, \'vin\', vehicles.vin, \'manufacturer\', vehicles.manufacturer, \'model\', vehicles.model)) FILTER (WHERE vehicles.id IS NOT NULL), \'[]\') as vehicles')
      )
      .where('fleets.id', fleetId)
      .groupBy('fleets.id')
      .first();
  }

  static async findByIdWithAnalytics(fleetId) {
    const fleet = await this.findById(fleetId);
    if (!fleet) return null;

    const analytics = await this.db('fleet_analytics')
      .where('fleet_id', fleetId)
      .orderBy('created_at', 'desc')
      .first();

    return {
      ...fleet,
      analytics: analytics || {}
    };
  }

  static async getVehicles(fleetId) {
    return await this.db('vehicles')
      .where('fleet_id', fleetId)
      .select('*');
  }
}

export default Fleet;
