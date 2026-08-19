import type { ErrorRequestHandler } from 'express';
import { BadRequestError } from '../utils/errors';
import { ConflictError } from '../utils/errors';
import { NotFoundError } from '../utils/errors';
import { UnauthorizedError } from '../utils/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof BadRequestError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({ message: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};
