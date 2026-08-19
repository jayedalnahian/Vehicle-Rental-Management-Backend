import type { Knex } from 'knex';
import type { CreateVehicleDTO, ListVehiclesQuery, UpdateVehicleDTO, VehicleRow } from './types';

export class VehicleRepository {
  constructor(private readonly db: Knex) {}

  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findActiveById(id: number, trx?: Knex.Transaction): Promise<VehicleRow | undefined> {
    const db = trx ?? this.db;
    return db('vehicles').where('id', id).whereNull('deleted_at').first();
  }

  async findActiveByPlate(
    plateNumber: string,
    excludeId?: number,
    trx?: Knex.Transaction,
  ): Promise<VehicleRow | undefined> {
    const db = trx ?? this.db;
    const query = db('vehicles').where('plate_number', plateNumber).whereNull('deleted_at');
    if (excludeId !== undefined) {
      query.whereNot('id', excludeId);
    }
    return query.first();
  }

  async list(query: ListVehiclesQuery, page: number, limit: number): Promise<VehicleRow[]> {
    const base = this.db('vehicles').whereNull('deleted_at');
    this.applyFilters(base, query);
    return base.orderBy('id', 'asc').limit(limit).offset((page - 1) * limit);
  }

  async count(query: ListVehiclesQuery): Promise<number> {
    const base = this.db('vehicles').whereNull('deleted_at');
    this.applyFilters(base, query);
    const result = await base.count<{ count: string }[]>('id as count').first();
    return Number(result?.count ?? 0);
  }

  async insert(data: CreateVehicleDTO & { photo_path: string | null }): Promise<VehicleRow> {
    const [row] = await this.db('vehicles')
      .insert({
        name: data.name,
        plate_number: data.plate_number,
        category: data.category,
        daily_rate: data.daily_rate,
        photo_path: data.photo_path,
      })
      .returning('*');
    return row;
  }

  async update(
    id: number,
    data: UpdateVehicleDTO & { photo_path?: string },
  ): Promise<VehicleRow | undefined> {
    const [row] = await this.db('vehicles')
      .where('id', id)
      .whereNull('deleted_at')
      .update({ ...data, updated_at: this.db.fn.now() })
      .returning('*');
    return row;
  }

  async softDelete(id: number): Promise<VehicleRow | undefined> {
    const [row] = await this.db('vehicles')
      .where('id', id)
      .whereNull('deleted_at')
      .update({ deleted_at: this.db.fn.now(), updated_at: this.db.fn.now() })
      .returning('*');
    return row;
  }

  private applyFilters(
    query: Knex.QueryBuilder<VehicleRow>,
    filters: ListVehiclesQuery,
  ): Knex.QueryBuilder<VehicleRow> {
    if (filters.category !== undefined) {
      query.where('category', filters.category);
    }
    if (filters.search !== undefined) {
      query.whereILike('name', `%${filters.search}%`);
    }
    return query;
  }
}