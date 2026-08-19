import type { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { LoginRequestBody, LoginResponseBody } from './types';

export class AuthController {
  constructor(private readonly authService: AuthService) {
    this.login = this.login.bind(this);
  }

  async login(
    req: Request<Record<string, string>, LoginResponseBody, LoginRequestBody>,
    res: Response<LoginResponseBody>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
