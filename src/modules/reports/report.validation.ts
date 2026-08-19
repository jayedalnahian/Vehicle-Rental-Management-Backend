import Joi from 'joi';
import type { ReportQuery } from './types';

export const reportQuerySchema: Joi.ObjectSchema<ReportQuery> = Joi.object({
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
  vehicle_id: Joi.number().integer().positive(),
});