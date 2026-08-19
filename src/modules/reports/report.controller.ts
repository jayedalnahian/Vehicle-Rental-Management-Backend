import type { NextFunction, Request, Response } from 'express';
import { ReportService } from './report.service';
import type { ReportQuery } from './types';

export class ReportController {
  constructor(private readonly reportService: ReportService) {
    this.generate = this.generate.bind(this);
  }

  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reportService.generate(req.query as unknown as ReportQuery);
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}
