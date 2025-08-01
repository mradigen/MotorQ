import db from '../db/config.js';

class BaseModel {
  static get tableName() {
    throw new Error('tableName must be defined in child class');
  }

  static get db() {
    return db;
  }

  static async create(data) {
    const [result] = await this.db(this.tableName)
      .insert(data)
      .returning('*');
    return result;
  }

  static async findById(id) {
    return await this.db(this.tableName)
      .where('id', id)
      .first();
  }

  static async findAll(conditions = {}) {
    let query = this.db(this.tableName);
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.where(key, value);
    });
    
    return await query;
  }

  static async update(id, data) {
    const [result] = await this.db(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    return result;
  }

  static async delete(id) {
    return await this.db(this.tableName)
      .where('id', id)
      .del();
  }

  static async findByVin(vin) {
    return await this.db(this.tableName)
      .where('vin', vin)
      .first();
  }
}

export default BaseModel;
