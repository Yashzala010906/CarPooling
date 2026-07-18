import { Controller } from '@nestjs/common';

import { ChatService } from './chat.service';

/**
 * Trip chat between driver and passengers (spec 5.4)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
}
