import type { NextFunction, Request, Response } from 'express';
import { ReportService } from './report.service';
import type { MonthlyReportResponse, ReportQuery } from './types';

export class ReportController {
  constructor(private readonly reportService: ReportService) {
    this.generate = this.generate.bind(this);
  }

  async generate(
    req: Request<Record<string, string>, MonthlyReportResponse, unknown, ReportQuery>,
    res: Response<MonthlyReportResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const report = await this.reportService.generate(req.query);
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}