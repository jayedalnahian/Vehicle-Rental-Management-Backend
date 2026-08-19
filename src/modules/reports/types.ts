export interface ReportQuery {
  month: string;
  vehicle_id?: number;
}

export interface ReportRentalRow {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  start_date: string;
  end_date: string;
  daily_rate: string;
}

export interface ReportVehicleAggregate {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface MonthlyReportResponse {
  month: string;
  vehicles: ReportVehicleAggregate[];
  top_vehicle: ReportVehicleAggregate | null;
}
