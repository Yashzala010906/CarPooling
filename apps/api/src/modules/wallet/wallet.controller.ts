import { Controller } from '@nestjs/common';

import { WalletService } from './wallet.service';

/**
 * Balance, recharge, wallet payments (spec 5.6)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
}
