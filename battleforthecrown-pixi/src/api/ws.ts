import { io, type Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import type { ServerEventName, ServerEvents } from './ws-types';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
export type StatusListener = (status: ConnectionStatus) => void;

class GameSocket {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'idle';
  private statusListeners = new Set<StatusListener>();

  connect(accessToken: string): void {
    if (this.socket?.connected) {
      return;
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    this.setStatus('connecting');
    this.socket = io(env.wsUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
      timeout: 10_000,
    });

    this.socket.on('connect', () => this.setStatus('connected'));
    this.socket.on('disconnect', () => this.setStatus('disconnected'));
    this.socket.on('connect_error', () => this.setStatus('disconnected'));
  }

  updateToken(accessToken: string): void {
    if (this.socket) {
      this.socket.auth = { token: accessToken };
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('idle');
  }

  joinWorld(worldId: string): void {
    this.socket?.emit('join:world', worldId);
  }

  on<E extends ServerEventName>(event: E, handler: (payload: ServerEvents[E]) => void): () => void {
    if (!this.socket) {
      return () => {};
    }
    const wrapped = (payload: ServerEvents[E]) => handler(payload);
    this.socket.on(event, wrapped as never);
    return () => {
      this.socket?.off(event, wrapped as never);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export const gameSocket = new GameSocket();
