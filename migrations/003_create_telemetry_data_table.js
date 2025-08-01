export function up(knex) {
  return knex.schema.createTable('telemetry_data', table => {
    table.increments('id').primary();
    table.integer('vehicle_id').unsigned().references('id').inTable('vehicles').onDelete('CASCADE');
    table.decimal('latitude', 10, 8).notNullable();
    table.decimal('longitude', 11, 8).notNullable();
    table.decimal('speed', 5, 2).notNullable(); // km/h
    table.enum('engine_status', ['On', 'Off', 'Idle']).notNullable();
    table.decimal('fuel_level', 5, 2).notNullable(); // percentage 0-100
    table.decimal('odometer', 10, 2).notNullable(); // total kilometers
    table.text('diagnostic_codes').nullable(); // JSON string of diagnostic codes
    table.timestamp('timestamp').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['vehicle_id']);
    table.index(['timestamp']);
    table.index(['vehicle_id', 'timestamp']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('telemetry_data');
}
