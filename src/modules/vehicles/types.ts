export interface VehicleRow {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: string;
  photo_path: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleResponse {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
  photo_path: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVehicleDTO {
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
}

export interface UpdateVehicleDTO {
  name?: string;
  plate_number?: string;
  category?: string;
  daily_rate?: number;
}

export interface ListVehiclesQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListVehiclesResponse {
  data: VehicleResponse[];
  pagination: PaginationMeta;
}