export interface Staff {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export type SafeStaff = Pick<Staff, 'id' | 'name' | 'email'>;

export interface AuthPayload {
  id: number;
  email: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponseBody {
  token: string;
  staff: SafeStaff;
}
