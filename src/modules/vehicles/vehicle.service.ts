import { promises as fs } from 'node:fs';
import path from 'node:path';
import { uploadDirectory } from '../../config/multer';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { VehicleRepository } from './vehicle.repository';
import type {
  CreateVehicleDTO,
  ListVehiclesQuery,
  ListVehiclesResponse,
  UpdateVehicleDTO,
  VehicleResponse,
  VehicleRow,
} from './types';

function toVehicleResponse(row: VehicleRow): VehicleResponse {
  return {
    id: row.id,
    name: row.name,
    plate_number: row.plate_number,
    category: row.category,
    daily_rate: Number(row.daily_rate),
    photo_path: row.photo_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function unlinkBestEffort(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // best effort cleanup; a missing/orphaned file must not fail the request
  }
}

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  return (err as { code?: unknown }).code === '23505';
}

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async create(dto: CreateVehicleDTO, photo?: Express.Multer.File): Promise<VehicleResponse> {
    try {
      const existing = await this.vehicleRepository.findActiveByPlate(dto.plate_number);
      if (existing) {
        throw new ConflictError('Plate number is already in use');
      }

      let row: VehicleRow;
      try {
        row = await this.vehicleRepository.insert({
          ...dto,
          photo_path: photo ? photo.filename : null,
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ConflictError('Plate number is already in use');
        }
        throw err;
      }

      return toVehicleResponse(row);
    } catch (err) {
      if (photo) {
        await unlinkBestEffort(photo.path);
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateVehicleDTO, photo?: Express.Multer.File): Promise<VehicleResponse> {
    try {
      const existing = await this.vehicleRepository.findActiveById(id);
      if (!existing) {
        throw new NotFoundError('Vehicle not found or unavailable');
      }

      if (dto.plate_number !== undefined && dto.plate_number !== existing.plate_number) {
        const conflict = await this.vehicleRepository.findActiveByPlate(dto.plate_number, id);
        if (conflict) {
          throw new ConflictError('Plate number is already in use');
        }
      }

      const updateData: UpdateVehicleDTO & { photo_path?: string } = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.plate_number !== undefined) updateData.plate_number = dto.plate_number;
      if (dto.category !== undefined) updateData.category = dto.category;
      if (dto.daily_rate !== undefined) updateData.daily_rate = dto.daily_rate;
      if (photo) updateData.photo_path = photo.filename;

      let row: VehicleRow | undefined;
      try {
        row = await this.vehicleRepository.update(id, updateData);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ConflictError('Plate number is already in use');
        }
        throw err;
      }

      if (!row) {
        throw new NotFoundError('Vehicle not found or unavailable');
      }

      if (photo && existing.photo_path) {
        await unlinkBestEffort(path.join(uploadDirectory, existing.photo_path));
      }

      return toVehicleResponse(row);
    } catch (err) {
      if (photo) {
        await unlinkBestEffort(photo.path);
      }
      throw err;
    }
  }

  async remove(id: number): Promise<VehicleResponse> {
    const row = await this.vehicleRepository.softDelete(id);
    if (!row) {
      throw new NotFoundError('Vehicle not found or unavailable');
    }
    return toVehicleResponse(row);
  }

  async getById(id: number): Promise<VehicleResponse> {
    const row = await this.vehicleRepository.findActiveById(id);
    if (!row) {
      throw new NotFoundError('Vehicle not found or unavailable');
    }
    return toVehicleResponse(row);
  }

  async list(query: ListVehiclesQuery): Promise<ListVehiclesResponse> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);

    const [rows, total] = await Promise.all([
      this.vehicleRepository.list(query, page, limit),
      this.vehicleRepository.count(query),
    ]);

    return {
      data: rows.map(toVehicleResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}