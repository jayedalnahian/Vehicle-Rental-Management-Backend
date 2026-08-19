import { Router } from 'express';
import db from '../../config/db';
import { requireAuth } from '../../middleware/auth';
import { validateQuery } from '../../middleware/validate';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { reportQuerySchema } from './report.validation';

const router = Router();

const reportRepository = new ReportRepository(db);
const reportService = new ReportService(reportRepository);
const reportController = new ReportController(reportService);

router.use(requireAuth);

router.get('/rentals', validateQuery(reportQuerySchema), reportController.generate);

export default router;
