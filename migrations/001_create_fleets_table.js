export function up(knex) {
  return knex.schema.createTable('fleets', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description').nullable();
    table.enum('type', ['Corporate', 'Rental', 'Personal']).defaultTo('Corporate');
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTable('fleets');
}
