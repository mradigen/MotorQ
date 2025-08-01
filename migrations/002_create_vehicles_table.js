export function up(knex) {
  return knex.schema.createTable('vehicles', table => {
    table.increments('id').primary();
    table.string('vin').unique().notNullable();
    table.string('manufacturer').notNullable();
    table.string('model').notNullable();
    table.integer('fleet_id').unsigned().references('id').inTable('fleets').onDelete('CASCADE');
    table.string('owner').nullable();
    table.enum('registration_status', ['Active', 'Maintenance', 'Decommissioned']).defaultTo('Active');
    table.timestamps(true, true);

    table.index(['vin']);
    table.index(['fleet_id']);
    table.index(['registration_status']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('vehicles');
}
