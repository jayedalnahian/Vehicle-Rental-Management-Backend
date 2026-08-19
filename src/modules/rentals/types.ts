export type RentalStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled';

export const RENTAL_STATUSES: readonly RentalStatus[] = [
  'booked',
  'ongoing',
  'completed',
  'cancelled',
] as const;

export const ACTIVE_RENTAL_STATUSES: readonly RentalStatus[] = ['booked', 'ongoing'] as const;

export interface RentalRow {
  id: number;
  vehicle_id: number;
  vehicle_name: string | null;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface RentalRowRaw {
  id: number;
  vehicle_id: number;
  vehicle_name: string | null;
  customer_name: string;
  customer_phone: string;
  start_date: string | Date;
  end_date: string | Date;
  total_amount: string;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface RentalResponse {
  id: number;
  vehicle_id: number;
  vehicle_name: string | null;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleForRental {
  id: number;
  daily_rate: number;
}

export interface CreateRentalDTO {
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
}

export interface UpdateRentalDTO {
  customer_name?: string;
  customer_phone?: string;
  start_date?: string;
  end_date?: string;
  status?: RentalStatus;
}

export interface ListRentalsQuery {
  vehicle_id?: number;
  status?: RentalStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListRentalsResponse {
  data: RentalResponse[];
  pagination: PaginationMeta;
}
