import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { SocketEvents, type Notification } from '@carpool/types';

/**
 * Pushes real-time notifications to connected users (bonus feature).
 * TODO: map userId to a socket room on handshake (e.g. room `user:{id}`).
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' } })
export class NotificationGateway {
  @WebSocketServer()
  server!: Server;

  notifyUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit(SocketEvents.NOTIFICATION_NEW, notification);
  }
}
