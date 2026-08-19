import type { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../utils/errors';
import { VehicleService } from './vehicle.service';
import type {
  CreateVehicleDTO,
  ListVehiclesQuery,
  ListVehiclesResponse,
  UpdateVehicleDTO,
  VehicleResponse,
} from './types';

function parseIdParam(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('Invalid vehicle id');
  }
  return id;
}

export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  async list(
    req: Request<Record<string, string>, ListVehiclesResponse, unknown, ListVehiclesQuery>,
    res: Response<ListVehiclesResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.vehicleService.list(req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: Request<{ id: string }, VehicleResponse>,
    res: Response<VehicleResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const vehicle = await this.vehicleService.getById(parseIdParam(req.params.id));
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: Request<Record<string, string>, VehicleResponse, CreateVehicleDTO>,
    res: Response<VehicleResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const vehicle = await this.vehicleService.create(req.body, req.file);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: Request<{ id: string }, VehicleResponse, UpdateVehicleDTO>,
    res: Response<VehicleResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const vehicle = await this.vehicleService.update(parseIdParam(req.params.id), req.body, req.file);
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async remove(
    req: Request<{ id: string }, VehicleResponse>,
    res: Response<VehicleResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const vehicle = await this.vehicleService.remove(parseIdParam(req.params.id));
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }
}