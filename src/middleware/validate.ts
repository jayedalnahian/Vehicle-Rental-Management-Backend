import type { RequestHandler, Response } from 'express';
import type Joi from 'joi';

function respondWithErrors(res: Response, error: Joi.ValidationError | undefined): boolean {
  if (error) {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
    return true;
  }
  return false;
}

export function validate(schema: Joi.ObjectSchema): RequestHandler {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false });

    if (respondWithErrors(res, error)) return;

    req.body = value;
    next();
  };
}

export function validateQuery(schema: Joi.ObjectSchema): RequestHandler {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.query, { abortEarly: false });

    if (respondWithErrors(res, error)) return;

    Object.assign(req.query, value);
    next();
  };
}
