import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) return;
    if (!token) return;

    const url = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'https://notification-service.afeez-dev.local';
    this.socket = io(url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();

