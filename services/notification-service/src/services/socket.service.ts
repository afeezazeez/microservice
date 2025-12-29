import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../middlewares/auth.middleware';



export class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<number, Set<string>> = new Map();

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'https://app.afeez-dev.local',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        if (decoded.type && decoded.type !== 'access') {
          return next(new Error('Invalid token type'));
        }

        socket.data.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
        } as AuthenticatedUser;

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user as AuthenticatedUser;
      const userId = user.id;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      socket.on('disconnect', () => {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });
  }

  broadcastToUser(userId: number, event: string, data: any): void {
    if (!this.io) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();

