import Joi from 'joi';
import type { CreateVehicleDTO, ListVehiclesQuery, UpdateVehicleDTO } from './types';

export const createVehicleSchema: Joi.ObjectSchema<CreateVehicleDTO> = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  plate_number: Joi.string().trim().min(1).max(50).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  daily_rate: Joi.number().positive().required(),
});

export const updateVehicleSchema: Joi.ObjectSchema<UpdateVehicleDTO> = Joi.object({
  name: Joi.string().trim().min(1).max(255),
  plate_number: Joi.string().trim().min(1).max(50),
  category: Joi.string().trim().min(1).max(100),
  daily_rate: Joi.number().positive(),
});

export const listVehiclesQuerySchema: Joi.ObjectSchema<ListVehiclesQuery> = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  category: Joi.string().trim().min(1).max(100),
  search: Joi.string().trim().min(1).max(255),
});