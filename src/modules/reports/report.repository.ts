import type { Knex } from 'knex';
import type { ReportRentalRow } from './types';

function formatDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value;
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class ReportRepository {
  constructor(private readonly db: Knex) {}

  async findReportRentals(
    monthStart: string,
    monthEnd: string,
    vehicleId?: number,
  ): Promise<ReportRentalRow[]> {
    const query = this.db('rentals')
      .select('rentals.id', 'rentals.vehicle_id', 'vehicles.name as vehicle_name')
      .select('rentals.start_date', 'rentals.end_date', 'vehicles.daily_rate')
      .innerJoin('vehicles', 'rentals.vehicle_id', 'vehicles.id')
      .whereNot('rentals.status', 'cancelled')
      .where('rentals.start_date', '<=', monthEnd)
      .where('rentals.end_date', '>=', monthStart);

    if (vehicleId !== undefined) {
      query.where('rentals.vehicle_id', vehicleId);
    }

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      vehicle_name: row.vehicle_name,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
      daily_rate: row.daily_rate,
    }));
  }

  async findVehicleById(id: number): Promise<{ id: number } | undefined> {
    return this.db('vehicles').select('id').where('id', id).first();
  }
}
