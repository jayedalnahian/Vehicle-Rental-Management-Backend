import { BadRequestError, NotFoundError } from '../../utils/errors';
import { ReportRepository } from './report.repository';
import type {
  MonthlyReportResponse,
  ReportQuery,
  ReportRentalRow,
  ReportVehicleAggregate,
} from './types';

interface MonthWindow {
  monthStart: string;
  monthEnd: string;
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function diffInDays(startDate: string, endDate: string): number {
  return Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86400000);
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function resolveMonthWindow(month: string): MonthWindow {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new BadRequestError('month must be in YYYY-MM format');
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]);

  if (monthIndex < 1 || monthIndex > 12) {
    throw new BadRequestError('month must be in YYYY-MM format');
  }

  const monthStart = toIsoDate(new Date(Date.UTC(year, monthIndex - 1, 1)));
  const monthEnd = toIsoDate(new Date(Date.UTC(year, monthIndex, 0)));

  return { monthStart, monthEnd };
}

function toAggregate(rows: ReportRentalRow[], monthStart: string, monthEnd: string): ReportVehicleAggregate[] {
  const byVehicle = new Map<number, ReportVehicleAggregate>();

  for (const row of rows) {
    const effectiveStart = row.start_date > monthStart ? row.start_date : monthStart;
    const effectiveEnd = row.end_date < monthEnd ? row.end_date : monthEnd;

    const daysInMonth = diffInDays(effectiveStart, effectiveEnd) + 1;
    const revenueInMonth = roundMoney(Number(row.daily_rate) * daysInMonth);

    const existing = byVehicle.get(row.vehicle_id);
    if (existing) {
      existing.total_bookings += 1;
      existing.days_rented += daysInMonth;
      existing.revenue = roundMoney(existing.revenue + revenueInMonth);
    } else {
      byVehicle.set(row.vehicle_id, {
        id: row.vehicle_id,
        name: row.vehicle_name,
        total_bookings: 1,
        days_rented: daysInMonth,
        revenue: revenueInMonth,
      });
    }
  }

  return [...byVehicle.values()];
}

export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async generate(query: ReportQuery): Promise<MonthlyReportResponse> {
    const { monthStart, monthEnd } = resolveMonthWindow(query.month);

    if (query.vehicle_id !== undefined) {
      const vehicle = await this.reportRepository.findVehicleById(query.vehicle_id);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
    }

    const rows = await this.reportRepository.findReportRentals(
      monthStart,
      monthEnd,
      query.vehicle_id,
    );

    const vehicles = toAggregate(rows, monthStart, monthEnd).sort((a, b) => {
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }
      return a.id - b.id;
    });

    return {
      month: query.month,
      vehicles,
      top_vehicle: vehicles.length > 0 ? vehicles[0] : null,
    };
  }
}
