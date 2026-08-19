import type { Knex } from 'knex';

const TABLE = 'vehicles';
const OLD_INDEX = 'vehicles_plate_number_unique';
const NEW_INDEX = 'vehicles_plate_number_active_unique';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropUnique(['plate_number'], OLD_INDEX);
  });
  await knex.schema.raw(
    `CREATE UNIQUE INDEX ${NEW_INDEX} ON ${TABLE} (plate_number) WHERE deleted_at IS NULL`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP INDEX IF EXISTS ${NEW_INDEX}`);
  await knex.schema.alterTable(TABLE, (table) => {
    table.unique(['plate_number'], OLD_INDEX);
  });
}