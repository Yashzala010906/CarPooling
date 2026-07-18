/** Standard API envelope returned by the NestJS TransformInterceptor. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** JWT payload shape shared between API (signing) and web (decoding). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Socket.IO event names shared between apps/api gateways and apps/web. */
export const SocketEvents = {
  // Trip tracking
  TRIP_JOIN: 'trip:join',
  TRIP_LEAVE: 'trip:leave',
  TRIP_LOCATION_UPDATE: 'trip:location:update',
  TRIP_STATUS_CHANGED: 'trip:status:changed',
  // Chat
  CHAT_JOIN: 'chat:join',
  CHAT_MESSAGE_SEND: 'chat:message:send',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  // Notifications
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
