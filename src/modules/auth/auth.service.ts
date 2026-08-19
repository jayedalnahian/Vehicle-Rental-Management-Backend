import { UnauthorizedError } from '../../utils/errors';
import { signToken } from '../../utils/jwt';
import { comparePassword } from '../../utils/password';
import { StaffRepository } from './staff.repository';
import type { AuthPayload, LoginResponseBody, SafeStaff } from './types';

export class AuthService {
  constructor(private readonly staffRepository: StaffRepository) {}

  async login(email: string, password: string): Promise<LoginResponseBody> {
    const staff = await this.staffRepository.findByEmail(email);

    if (!staff) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(password, staff.password_hash);

    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: AuthPayload = { id: staff.id, email: staff.email };
    const token = signToken(payload);

    const safeStaff: SafeStaff = { id: staff.id, name: staff.name, email: staff.email };

    return { token, staff: safeStaff };
  }
}
