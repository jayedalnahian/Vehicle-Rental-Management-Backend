import type { ErrorRequestHandler } from 'express';
import { UnauthorizedError } from '../utils/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  if (err instanceof UnauthorizedError) {
    res.status(401).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};
