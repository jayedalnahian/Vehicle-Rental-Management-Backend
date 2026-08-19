import type { Knex } from 'knex';
import type { Staff } from './types';

export class StaffRepository {
  constructor(private readonly db: Knex) {}

  async findByEmail(email: string): Promise<Staff | undefined> {
    return this.db<Staff>('staff').where('email', email).first();
  }

  async findById(id: number): Promise<Staff | undefined> {
    return this.db<Staff>('staff').where('id', id).first();
  }
}
