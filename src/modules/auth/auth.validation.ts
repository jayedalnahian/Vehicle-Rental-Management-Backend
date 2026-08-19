import Joi from 'joi';
import type { LoginRequestBody } from './types';

export const loginSchema: Joi.ObjectSchema<LoginRequestBody> = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});