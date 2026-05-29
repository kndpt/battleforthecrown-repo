import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../../common/auth';
import type { EventKind, PayloadForKind } from './event-types';

interface AuthSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.userId = payload.sub;
      client.join(`user:${client.userId}`);

      this.logger.log(`Client ${client.id} connected as user ${client.userId}`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.log(
      `Client ${client.id} disconnected (user: ${client.userId})`,
    );
  }

  @SubscribeMessage('join:world')
  handleJoinWorld(client: AuthSocket, worldId: string) {
    if (!client.userId) {
      return { event: 'error', data: 'Not authenticated' };
    }
    client.join(`world:${worldId}`);
    this.logger.log(`User ${client.userId} joined world ${worldId}`);
    return { event: 'joined', data: `world:${worldId}` };
  }

  notifyUser<K extends EventKind>(
    userId: string,
    event: K,
    data: PayloadForKind<K>,
  ) {
    const emitTime = Date.now();
    this.logger.log(`📡 [Gateway] Emit WebSocket à ${emitTime}:`, {
      userId,
      event,
      room: `user:${userId}`,
    });
    this.server.to(`user:${userId}`).emit(event, data);
  }

  notifyWorld<K extends EventKind>(
    worldId: string,
    event: K,
    data: PayloadForKind<K>,
  ) {
    this.server.to(`world:${worldId}`).emit(event, data);
  }
}
