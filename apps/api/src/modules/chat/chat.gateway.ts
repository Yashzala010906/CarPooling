import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SocketEvents, type SendChatMessageRequest } from '@carpool/types';

import { ChatService } from './chat.service';

/**
 * Trip chat over Socket.IO (spec 5.4).
 * Rooms are keyed by tripId; the Trip module reuses the same rooms for
 * live-tracking relays (SocketEvents.TRIP_LOCATION_UPDATE).
 * TODO: authenticate the socket handshake with the JWT.
 */
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage(SocketEvents.CHAT_JOIN)
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() tripId: string) {
    void client.join(`trip:${tripId}`);
  }

  @SubscribeMessage(SocketEvents.CHAT_MESSAGE_SEND)
  handleMessage(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: SendChatMessageRequest,
  ) {
    // TODO: persist via chatService, then broadcast:
    // this.server.to(`trip:${payload.tripId}`).emit(SocketEvents.CHAT_MESSAGE_RECEIVED, saved);
    void payload;
  }
}
