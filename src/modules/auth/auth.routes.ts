import { Router } from 'express';
import db from '../../config/db';
import { loginRateLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffRepository } from './staff.repository';
import { loginSchema } from './auth.validation';

const router = Router();

const staffRepository = new StaffRepository(db);
const authService = new AuthService(staffRepository);
const authController = new AuthController(authService);

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

export default router;
