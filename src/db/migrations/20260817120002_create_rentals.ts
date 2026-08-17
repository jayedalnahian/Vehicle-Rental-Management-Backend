import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('rentals', (table) => {
    table.increments('id').primary();
    table
      .integer('vehicle_id')
      .notNullable()
      .unsigned()
      .references('id')
      .inTable('vehicles')
      .onDelete('RESTRICT');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 50).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.text('status').notNullable().defaultTo('booked');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.check(
      "status IN ('booked', 'ongoing', 'completed', 'cancelled')",
      undefined,
      'rentals_status_check'
    );
    table.check('end_date >= start_date', undefined, 'rentals_dates_check');

    table.index('vehicle_id');
    table.index('status');
    table.index(['start_date', 'end_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('rentals');
}
