import 'dotenv/config';
import type { Knex } from 'knex';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const knexConfig: Knex.Config = {
  client: 'pg',
  connection: required('DATABASE_URL'),
  pool: {
    min: Number(process.env.DB_POOL_MIN ?? 0),
    max: Number(process.env.DB_POOL_MAX ?? 10),
  },
  migrations: {
    directory: 'src/db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: 'src/db/seeds',
    extension: 'ts',
  },
} as const;
