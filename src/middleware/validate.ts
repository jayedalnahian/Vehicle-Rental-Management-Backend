import type { RequestHandler } from 'express';
import type Joi from 'joi';
import { ValidationError } from '../utils/errors';

function validationError(error: Joi.ValidationError): ValidationError {
  return new ValidationError(
    'Validation failed',
    error.details.map((detail) => detail.message),
  );
}

export function validate<B>(
  schema: Joi.ObjectSchema<B>,
): RequestHandler<Record<string, string>, unknown, B> {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      next(validationError(error));
      return;
    }

    req.body = value;
    next();
  };
}

export function validateQuery<Q extends object>(
  schema: Joi.ObjectSchema<Q>,
): RequestHandler<Record<string, string>, unknown, unknown, Q> {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      next(validationError(error));
      return;
    }

    // Express 5 exposes req.query as a getter-only property that re-parses on every
    // access, so mutation (Object.assign) is silently discarded. Replace the
    // property with the validated/coerced value instead.
    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    });
    next();
  };
}