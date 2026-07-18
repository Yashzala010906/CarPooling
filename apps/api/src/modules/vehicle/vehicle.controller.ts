import { Controller } from '@nestjs/common';

import { VehicleService } from './vehicle.service';

/**
 * Vehicle registration and management (spec 5.8)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}
}
