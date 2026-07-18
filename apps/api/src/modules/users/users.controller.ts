import { Controller } from '@nestjs/common';

import { UsersService } from './users.service';

/**
 * Employee profiles (spec 5.1, 6)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
