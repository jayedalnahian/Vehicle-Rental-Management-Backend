import Joi from 'joi';
import { RENTAL_STATUSES } from './types';

const isoDateString = Joi.date().iso().raw();

export const createRentalSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  customer_name: Joi.string().trim().min(1).max(255).required(),
  customer_phone: Joi.string().trim().min(1).max(50).required(),
  start_date: isoDateString.required(),
  end_date: isoDateString.min(Joi.ref('start_date')).required(),
});

export const updateRentalSchema = Joi.object({
  customer_name: Joi.string().trim().min(1).max(255),
  customer_phone: Joi.string().trim().min(1).max(50),
  start_date: isoDateString,
  end_date: isoDateString.when('start_date', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('start_date')).raw(),
    otherwise: isoDateString,
  }),
  status: Joi.string().valid(...RENTAL_STATUSES),
}).min(1);

export const listRentalsQuerySchema = Joi.object({
  vehicle_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...RENTAL_STATUSES),
  start_date: Joi.string().isoDate(),
  end_date: Joi.string().isoDate(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
}).with('start_date', 'end_date');
