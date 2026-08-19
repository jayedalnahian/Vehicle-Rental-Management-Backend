import type { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../utils/errors';
import { RentalService } from './rental.service';
import type {
  CreateRentalDTO,
  ListRentalsQuery,
  ListRentalsResponse,
  RentalResponse,
  UpdateRentalDTO,
} from './types';

function parseIdParam(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('Invalid rental id');
  }
  return id;
}

export class RentalController {
  constructor(private readonly rentalService: RentalService) {
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  async list(
    req: Request<Record<string, string>, ListRentalsResponse, unknown, ListRentalsQuery>,
    res: Response<ListRentalsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.rentalService.list(req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(
    req: Request<{ id: string }, RentalResponse>,
    res: Response<RentalResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rental = await this.rentalService.getById(parseIdParam(req.params.id));
      res.status(200).json(rental);
    } catch (err) {
      next(err);
    }
  }

  async create(
    req: Request<Record<string, string>, RentalResponse, CreateRentalDTO>,
    res: Response<RentalResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rental = await this.rentalService.create(req.body);
      res.status(201).json(rental);
    } catch (err) {
      next(err);
    }
  }

  async update(
    req: Request<{ id: string }, RentalResponse, UpdateRentalDTO>,
    res: Response<RentalResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rental = await this.rentalService.update(parseIdParam(req.params.id), req.body);
      res.status(200).json(rental);
    } catch (err) {
      next(err);
    }
  }

  async cancel(
    req: Request<{ id: string }, RentalResponse>,
    res: Response<RentalResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rental = await this.rentalService.cancel(parseIdParam(req.params.id));
      res.status(200).json(rental);
    } catch (err) {
      next(err);
    }
  }
}