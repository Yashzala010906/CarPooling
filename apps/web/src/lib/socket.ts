import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Lazily connect the shared Socket.IO client.
 * Used for live trip tracking, chat, and notifications.
 * Event names live in @carpool/types (SocketEvents).
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket'],
      // TODO: auth: { token: useAuthStore.getState().accessToken }
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
