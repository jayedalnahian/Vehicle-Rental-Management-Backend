import { ConflictError } from '../../utils/errors';
import { NotFoundError } from '../../utils/errors';
import type {
  CreateRentalDTO,
  ListRentalsQuery,
  ListRentalsResponse,
  RentalResponse,
  RentalRow,
  UpdateRentalDTO,
} from './types';
import { RentalRepository } from './rental.repository';

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function diffInDays(startDate: string, endDate: string): number {
  return Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86400000);
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function toRentalResponse(row: RentalRow): RentalResponse {
  return {
    id: row.id,
    vehicle_id: row.vehicle_id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    start_date: row.start_date,
    end_date: row.end_date,
    total_amount: Number(row.total_amount),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class RentalService {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async create(dto: CreateRentalDTO): Promise<RentalResponse> {
    const days = diffInDays(dto.start_date, dto.end_date) + 1;

    return this.rentalRepository.transaction(async (trx) => {
      const vehicle = await this.rentalRepository.findActiveVehicleById(dto.vehicle_id, trx);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      await this.rentalRepository.lockVehicleForUpdate(trx, dto.vehicle_id);

      const conflicts = await this.rentalRepository.findOverlappingActive(
        dto.vehicle_id,
        dto.start_date,
        dto.end_date,
        undefined,
        trx,
      );

      if (conflicts.length > 0) {
        throw new ConflictError('Vehicle is already booked for the requested dates');
      }

      const totalAmount = roundMoney(Number(vehicle.daily_rate) * days);
      const row = await this.rentalRepository.insert(trx, { ...dto, total_amount: totalAmount });
      return toRentalResponse(row);
    });
  }

  async update(id: number, dto: UpdateRentalDTO): Promise<RentalResponse> {
    return this.rentalRepository.transaction(async (trx) => {
      const existing = await this.rentalRepository.findById(id, trx);
      if (!existing) {
        throw new NotFoundError('Rental not found');
      }

      const startChanged = dto.start_date !== undefined && dto.start_date !== existing.start_date;
      const endChanged = dto.end_date !== undefined && dto.end_date !== existing.end_date;
      const datesChanged = startChanged || endChanged;

      const updateData: Partial<UpdateRentalDTO> & { total_amount?: number } = {};
      if (dto.customer_name !== undefined) updateData.customer_name = dto.customer_name;
      if (dto.customer_phone !== undefined) updateData.customer_phone = dto.customer_phone;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.start_date !== undefined) updateData.start_date = dto.start_date;
      if (dto.end_date !== undefined) updateData.end_date = dto.end_date;

      if (datesChanged) {
        await this.rentalRepository.lockVehicleForUpdate(trx, existing.vehicle_id);

        const newStart = dto.start_date ?? existing.start_date;
        const newEnd = dto.end_date ?? existing.end_date;

        const conflicts = await this.rentalRepository.findOverlappingActive(
          existing.vehicle_id,
          newStart,
          newEnd,
          id,
          trx,
        );

        if (conflicts.length > 0) {
          throw new ConflictError('Vehicle is already booked for the requested dates');
        }

        const vehicle = await this.rentalRepository.findActiveVehicleById(existing.vehicle_id, trx);
        if (!vehicle) {
          throw new NotFoundError('Vehicle not found');
        }

        const days = diffInDays(newStart, newEnd) + 1;
        updateData.total_amount = roundMoney(Number(vehicle.daily_rate) * days);
      }

      const row = await this.rentalRepository.update(trx, id, updateData);
      return toRentalResponse(row);
    });
  }

  async cancel(id: number): Promise<RentalResponse> {
    return this.rentalRepository.transaction(async (trx) => {
      const existing = await this.rentalRepository.findById(id, trx);
      if (!existing) {
        throw new NotFoundError('Rental not found');
      }

      const row = await this.rentalRepository.update(trx, id, { status: 'cancelled' });
      return toRentalResponse(row);
    });
  }

  async getById(id: number): Promise<RentalResponse> {
    const row = await this.rentalRepository.findById(id);
    if (!row) {
      throw new NotFoundError('Rental not found');
    }
    return toRentalResponse(row);
  }

  async list(query: ListRentalsQuery): Promise<ListRentalsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await Promise.all([
      this.rentalRepository.list(query, page, limit),
      this.rentalRepository.count(query),
    ]);

    return {
      data: rows.map(toRentalResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
