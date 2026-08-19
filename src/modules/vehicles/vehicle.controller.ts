import type { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../utils/errors';
import { VehicleService } from './vehicle.service';
import type { CreateVehicleDTO, ListVehiclesQuery, UpdateVehicleDTO } from './types';

function parseIdParam(raw: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
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

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.vehicleService.list(req.query as ListVehiclesQuery);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await this.vehicleService.getById(parseIdParam(req.params.id));
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await this.vehicleService.create(req.body as CreateVehicleDTO, req.file);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await this.vehicleService.update(
        parseIdParam(req.params.id),
        req.body as UpdateVehicleDTO,
        req.file,
      );
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await this.vehicleService.remove(parseIdParam(req.params.id));
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  }
}