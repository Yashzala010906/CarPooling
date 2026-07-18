import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '@/prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

/**
 * Authentication: registration, login, token issuing/rotation (spec 5.1).
 * TODO: hash passwords with bcrypt, issue access+refresh tokens,
 * validate company code against the Company table.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(_dto: RegisterDto) {
    throw new NotImplementedException('AuthService.register not implemented');
  }

  async login(_dto: LoginDto) {
    throw new NotImplementedException('AuthService.login not implemented');
  }

  async refresh() {
    throw new NotImplementedException('AuthService.refresh not implemented');
  }
}
