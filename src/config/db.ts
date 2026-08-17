import knex from 'knex';
import { knexConfig } from './knex-config';

const db = knex(knexConfig);

export default db;
