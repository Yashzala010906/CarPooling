import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload, UserRole } from '@carpool/types';

import { ROLES_KEY } from '../decorators/roles.decorator';

/** Enforces @Roles(...) metadata against the JWT payload role. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user }: { user: JwtPayload } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
