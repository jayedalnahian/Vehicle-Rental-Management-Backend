import type { RequestHandler } from 'express';
import type Joi from 'joi';

export function validate(schema: Joi.ObjectSchema): RequestHandler {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      res.status(400).json({ errors: error.details.map((detail) => detail.message) });
      return;
    }

    next();
  };
}
