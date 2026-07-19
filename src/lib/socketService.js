// Use window.io from CDN or local bundle
const getIo = () => typeof window !== 'undefined' ? window.io : null;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
  }

  // Initialize and connect Socket.IO client
  connect(token) {
    if (this.socket) return this.socket;

    const io = getIo();
    if (!io) {
      console.warn('[Socket.IO] io library not available on window, running in client relay mode.');
      return null;
    }

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: token ? { token } : {}
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[Socket.IO] Connected to backend server:', this.socket.id);
      });

      this.socket.on('connect_error', (err) => {
        this.isConnected = false;
        console.warn('[Socket.IO] Backend connection unavailable, operating in local realtime relay mode:', err.message);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[Socket.IO] Disconnected:', reason);
      });
    } catch (e) {
      console.warn('[Socket.IO] Socket initialization exception:', e);
    }

    return this.socket;
  }

  // Join a specific trip room for live location streaming
  joinTrip(tripId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:trip', { tripId });
    }
    console.log(`[Socket.IO] Joined trip room: ${tripId}`);
  }

  // Leave trip room
  leaveTrip(tripId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:trip', { tripId });
    }
  }

  // Broadcast driver live location update
  emitLocationUpdate(locationData) {
    const payload = {
      tripId: locationData.tripId,
      lat: locationData.lat,
      lng: locationData.lng,
      x: locationData.x,
      y: locationData.y,
      speed: locationData.speed || 0,
      heading: locationData.heading || 0,
      timestamp: new Date().toISOString()
    };

    // Emit over Socket.IO socket if connected
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:location_update', payload);
    }

    // Trigger local listeners for client standalone mode
    this.triggerLocal('location_updated', payload);
  }

  // Register listener for location updates
  onLocationUpdate(callback) {
    // Attach to real Socket.IO event if available
    if (this.socket) {
      this.socket.on('location_updated', callback);
      this.socket.on('driver:location_changed', callback);
    }

    // Also register in local listeners registry
    if (!this.listeners.has('location_updated')) {
      this.listeners.set('location_updated', new Set());
    }
    this.listeners.get('location_updated').add(callback);

    // Return cleanup unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.off('location_updated', callback);
        this.socket.off('driver:location_changed', callback);
      }
      if (this.listeners.has('location_updated')) {
        this.listeners.get('location_updated').delete(callback);
      }
    };
  }

  // Trigger internal listeners
  triggerLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(fn => {
        try {
          fn(data);
        } catch (err) {
          console.error('[Socket.IO] Local event listener error:', err);
        }
      });
    }
  }

  // Disconnect socket client
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

export const socketService = new SocketService();
export default socketService;
