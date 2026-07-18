import { Controller } from '@nestjs/common';

import { ReportsService } from './reports.service';

/**
 * Trips, distance, fuel, cost analytics (spec 5.9)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
}
