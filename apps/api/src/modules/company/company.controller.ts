import { Controller } from '@nestjs/common';

import { CompanyService } from './company.service';

/**
 * Company administration: employees, org settings (spec 3)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
}
