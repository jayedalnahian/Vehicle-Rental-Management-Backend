import express from 'express';
import authRouter from './modules/auth/auth.routes';
import rentalsRouter from './modules/rentals/rental.routes';
import reportsRouter from './modules/reports/report.routes';
import vehiclesRouter from './modules/vehicles/vehicle.routes';
import { uploadDirectory } from './config/multer';
import { errorHandler } from './middleware/error-handler';
import { NotFoundError } from './utils/errors';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/rentals', rentalsRouter);
app.use('/reports', reportsRouter);

app.use('/uploads', express.static(uploadDirectory));

app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

app.use(errorHandler);

export default app;
