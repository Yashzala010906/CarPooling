import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@carpool/types';

/** Injects the authenticated user's JWT payload into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    return data ? user?.[data] : user;
  },
);
