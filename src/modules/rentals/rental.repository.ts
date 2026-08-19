import type { Knex } from 'knex';
import type {
  CreateRentalDTO,
  ListRentalsQuery,
  RentalRow,
  RentalRowRaw,
  VehicleForRental,
} from './types';

function formatDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value;
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class RentalRepository {
  constructor(private readonly db: Knex) {}

  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findActiveVehicleById(
    vehicleId: number,
    trx?: Knex.Transaction,
  ): Promise<VehicleForRental | undefined> {
    const db = trx ?? this.db;
    return db('vehicles')
      .select('id', 'daily_rate')
      .where('id', vehicleId)
      .whereNull('deleted_at')
      .first();
  }

  async lockVehicleForUpdate(trx: Knex.Transaction, vehicleId: number): Promise<void> {
    await trx('vehicles').select('id').where('id', vehicleId).forUpdate();
  }

  async findOverlappingActive(
    vehicleId: number,
    startDate: string,
    endDate: string,
    excludeId?: number,
    trx?: Knex.Transaction,
  ): Promise<RentalRow[]> {
    const db = trx ?? this.db;
    const query = db('rentals')
      .where('vehicle_id', vehicleId)
      .whereIn('status', ['booked', 'ongoing'])
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate);

    if (excludeId !== undefined) {
      query.whereNot('id', excludeId);
    }

    const rows = await query;
    return rows.map((row) => this.normalizeRow(row));
  }

  async findById(id: number, trx?: Knex.Transaction): Promise<RentalRow | undefined> {
    const db = trx ?? this.db;
    const row = await db('rentals')
      .select('rentals.*', 'vehicles.name as vehicle_name')
      .leftJoin('vehicles', 'rentals.vehicle_id', 'vehicles.id')
      .where('rentals.id', id)
      .first();
    return row ? this.normalizeRow(row) : undefined;
  }

  async insert(
    trx: Knex.Transaction,
    data: CreateRentalDTO & { total_amount: number },
  ): Promise<RentalRow> {
    const [row] = await trx('rentals')
      .insert({
        vehicle_id: data.vehicle_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        start_date: data.start_date,
        end_date: data.end_date,
        total_amount: data.total_amount,
        status: 'booked',
      })
      .returning('*');
    return this.normalizeRow(row);
  }

  async update(
    trx: Knex.Transaction,
    id: number,
    data: Partial<Omit<CreateRentalDTO, 'vehicle_id'> & { status: string; total_amount: number }>,
  ): Promise<RentalRow> {
    const [row] = await trx('rentals')
      .where('id', id)
      .update({ ...data, updated_at: trx.fn.now() })
      .returning('*');
    return this.normalizeRow(row);
  }

  async list(query: ListRentalsQuery, page: number, limit: number): Promise<RentalRow[]> {
    const base = this.db('rentals')
      .select('rentals.*', 'vehicles.name as vehicle_name')
      .leftJoin('vehicles', 'rentals.vehicle_id', 'vehicles.id');
    this.applyFilters(base, query);
    const rows = await base
      .orderBy('start_date', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);
    return rows.map((row) => this.normalizeRow(row));
  }

  async count(query: ListRentalsQuery): Promise<number> {
    const base = this.db('rentals');
    this.applyFilters(base, query);
    const result = await base.count<{ count: string }[]>('id as count').first();
    return Number(result?.count ?? 0);
  }

  private normalizeRow(row: RentalRowRaw): RentalRow {
    return {
      ...row,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
      vehicle_name: row.vehicle_name ?? null,
    };
  }

  private applyFilters(
    query: Knex.QueryBuilder<RentalRow>,
    filters: ListRentalsQuery,
  ): Knex.QueryBuilder<RentalRow> {
    if (filters.vehicle_id !== undefined) {
      query.where('vehicle_id', filters.vehicle_id);
    }
    if (filters.status !== undefined) {
      query.where('status', filters.status);
    }
    if (filters.start_date !== undefined && filters.end_date !== undefined) {
      query.where('start_date', '<=', filters.end_date).where('end_date', '>=', filters.start_date);
    } else if (filters.start_date !== undefined) {
      query.where('end_date', '>=', filters.start_date);
    } else if (filters.end_date !== undefined) {
      query.where('start_date', '<=', filters.end_date);
    }
    return query;
  }
}
