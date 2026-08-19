import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthPayload } from '../modules/auth/types';

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.jwtSecret);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  const id = decoded.id;
  const email = decoded.email;

  if (typeof id !== 'number' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }

  return { id, email };
}
