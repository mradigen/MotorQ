export function up(knex) {
  return knex.schema.createTable('fleet_analytics', table => {
    table.increments('id').primary();
    table.integer('fleet_id').unsigned().references('id').inTable('fleets').onDelete('CASCADE');
    table.integer('total_vehicles').defaultTo(0);
    table.integer('active_vehicles').defaultTo(0);
    table.integer('inactive_vehicles').defaultTo(0);
    table.decimal('average_fuel_level', 5, 2).defaultTo(0);
    table.decimal('total_distance_24h', 10, 2).defaultTo(0);
    table.integer('alert_count').defaultTo(0);
    table.integer('alert_count_severe').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['fleet_id']);
    table.index(['created_at']);
    table.index(['fleet_id', 'created_at']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('fleet_analytics');
}
