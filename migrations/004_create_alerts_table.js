export function up(knex) {
  return knex.schema.createTable('alerts', table => {
    table.increments('id').primary();
    table.string('alert_id').unique().notNullable(); // Custom UUID for external reference
    table.integer('vehicle_id').unsigned().references('id').inTable('vehicles').onDelete('CASCADE');
    table.enum('violation_type', ['Overspeeding', 'Low Fuel', 'Engine Error', 'Maintenance Required']).notNullable();
    table.integer('severity').notNullable(); // 0-5 scale
    table.text('description').nullable();
    table.text('telemetry_data').nullable(); // JSON string of related telemetry data
    table.timestamp('timestamp').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['vehicle_id']);
    table.index(['violation_type']);
    table.index(['severity']);
    table.index(['timestamp']);
    table.index(['alert_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('alerts');
}
