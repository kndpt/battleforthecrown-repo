import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GameGateway } from './game.gateway';
import { Server, Socket } from 'socket.io';
import type {
  BattleResolvedPayload,
  BattleSentPayload,
  BuildingCompletedPayload,
  ResourcesChangedPayload,
} from './event-types';

/* eslint-disable @typescript-eslint/unbound-method */

interface AuthSocket extends Socket {
  userId?: string;
}

type MockHandshake = {
  headers: Record<string, string | string[] | undefined>;
  auth: Record<string, unknown>;
  time: string;
  address: string;
  xdomain: boolean;
  secure: boolean;
  issued: number;
  url: string;
  query: Record<string, unknown>;
};

const createMockHandshake = (
  overrides: Partial<MockHandshake> = {},
): MockHandshake => ({
  headers: {},
  auth: {},
  time: new Date().toISOString(),
  address: '127.0.0.1',
  xdomain: false,
  secure: false,
  issued: Date.now(),
  url: '/socket.io',
  query: {},
  ...overrides,
});

const createMockSocket = (
  handshakeOverrides: Partial<MockHandshake> = {},
): AuthSocket =>
  ({
    id: 'socket-123',
    handshake: createMockHandshake(handshakeOverrides),
    disconnect: jest.fn(),
    join: jest.fn(),
    emit: jest.fn(),
  }) as unknown as AuthSocket;

const createSocketWithUser = (
  userId?: string,
  handshakeOverrides: Partial<MockHandshake> = {},
): AuthSocket => {
  const socket = createMockSocket(handshakeOverrides);
  if (typeof userId !== 'undefined') {
    socket.userId = userId;
  }
  return socket;
};

describe('GameGateway', () => {
  let gateway: GameGateway;
  let jwtService: JwtService;
  let mockServer: Partial<Server>;
  let mockSocket: AuthSocket;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocket = createMockSocket();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    module.useLogger(false);

    gateway = module.get<GameGateway>(GameGateway);
    jwtService = module.get<JwtService>(JwtService);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    describe('Success cases', () => {
      it('should connect with valid token from auth', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'valid-token' };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
        expect(mockSocket.userId).toBe('user-1');
        expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
        expect(mockSocket.disconnect).not.toHaveBeenCalled();
      });

      it('should connect with valid token from authorization header', async () => {
        // Arrange
        mockSocket.handshake.auth = {};
        mockSocket.handshake.headers = {
          authorization: 'Bearer valid-token',
        };
        mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-2' });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
        expect(mockSocket.userId).toBe('user-2');
        expect(mockSocket.join).toHaveBeenCalledWith('user:user-2');
      });

      it('should extract token from Bearer header correctly', async () => {
        // Arrange
        mockSocket.handshake.auth = {};
        mockSocket.handshake.headers = {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.signature',
        };
        mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(jwtService.verifyAsync).toHaveBeenCalledWith(
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.signature',
        );
      });
    });

    describe('Error cases - No token', () => {
      it('should disconnect when no token provided', async () => {
        // Arrange
        mockSocket.handshake.auth = {};
        mockSocket.handshake.headers = {};

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        expect(mockSocket.userId).toBeUndefined();
      });

      it('should disconnect when token is null', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: null };
        mockSocket.handshake.headers = {};

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      });

      it('should disconnect when token is empty string', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: '' };
        mockSocket.handshake.headers = {};

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
      });
    });

    describe('Error cases - Invalid token', () => {
      it('should disconnect on invalid token', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'invalid-token' };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockRejectedValue(
          new Error('Invalid token'),
        );

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(mockSocket.userId).toBeUndefined();
      });

      it('should disconnect on expired token', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'expired-token' };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockRejectedValue(
          new Error('Token expired'),
        );

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
      });

      it('should disconnect on malformed JWT', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'malformed.jwt' };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid JWT'));

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.disconnect).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should prefer auth token over header', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'auth-token' };
        mockSocket.handshake.headers = {
          authorization: 'Bearer header-token',
        };
        mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(jwtService.verifyAsync).toHaveBeenCalledWith('auth-token');
      });

      it('should handle token with special characters', async () => {
        // Arrange
        const specialToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        mockSocket.handshake.auth = { token: specialToken };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(jwtService.verifyAsync).toHaveBeenCalledWith(specialToken);
      });

      it('should handle user ID with special characters', async () => {
        // Arrange
        mockSocket.handshake.auth = { token: 'valid-token' };
        mockSocket.handshake.headers = {};
        mockJwtService.verifyAsync.mockResolvedValue({
          sub: 'user-uuid-550e8400-e29b-41d4-a716',
        });

        // Act
        await gateway.handleConnection(mockSocket);

        // Assert
        expect(mockSocket.join).toHaveBeenCalledWith(
          'user:user-uuid-550e8400-e29b-41d4-a716',
        );
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnect with user ID', () => {
      // Arrange
      const socket = createSocketWithUser('user-1');

      // Act
      gateway.handleDisconnect(socket);

      // Assert
      expect(socket.userId).toBe('user-1');
    });

    it('should handle disconnect without user ID', () => {
      // Act & Assert (should not throw)
      gateway.handleDisconnect(mockSocket);
    });
  });

  describe('handleJoinWorld', () => {
    describe('Success cases', () => {
      it('should join world when authenticated', () => {
        // Arrange
        const socket = createSocketWithUser('user-1');

        // Act
        const result = gateway.handleJoinWorld(socket, 'world-1');

        // Assert
        expect(socket.join).toHaveBeenCalledWith('world:world-1');
        expect(result).toEqual({
          event: 'joined',
          data: 'world:world-1',
        });
      });

      it('should join multiple worlds', () => {
        // Arrange
        const socket = createSocketWithUser('user-1');

        // Act
        const result1 = gateway.handleJoinWorld(socket, 'world-1');
        const result2 = gateway.handleJoinWorld(socket, 'world-2');

        // Assert
        expect(socket.join).toHaveBeenCalledWith('world:world-1');
        expect(socket.join).toHaveBeenCalledWith('world:world-2');
        expect(result1.data).toBe('world:world-1');
        expect(result2.data).toBe('world:world-2');
      });

      it('should handle world ID with special characters', () => {
        // Arrange
        const socket = createSocketWithUser('user-1');
        const worldId = 'world-uuid-550e8400-e29b-41d4-a716';

        // Act
        const result = gateway.handleJoinWorld(socket, worldId);

        // Assert
        expect(socket.join).toHaveBeenCalledWith(`world:${worldId}`);
        expect(result.data).toBe(`world:${worldId}`);
      });
    });

    describe('Error cases', () => {
      it('should reject when not authenticated', () => {
        // Arrange
        const socket = createSocketWithUser(undefined);

        // Act
        const result = gateway.handleJoinWorld(socket, 'world-1');

        // Assert
        expect(result).toEqual({
          event: 'error',
          data: 'Not authenticated',
        });
        expect(socket.join).not.toHaveBeenCalled();
      });

      it('should reject when userId is empty', () => {
        // Arrange
        const socket = createSocketWithUser('');

        // Act
        const result = gateway.handleJoinWorld(socket, 'world-1');

        // Assert
        expect(result).toEqual({
          event: 'error',
          data: 'Not authenticated',
        });
      });

      it('should reject when userId is null', () => {
        // Arrange
        const socket = createSocketWithUser();
        socket.userId = null as unknown as string;

        // Act
        const result = gateway.handleJoinWorld(socket, 'world-1');

        // Assert
        expect(result).toEqual({
          event: 'error',
          data: 'Not authenticated',
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle numeric world ID', () => {
        // Arrange
        const socket = createSocketWithUser('user-1');

        // Act
        const result = gateway.handleJoinWorld(socket, '12345');

        // Assert
        expect(socket.join).toHaveBeenCalledWith('world:12345');
        expect(result.data).toBe('world:12345');
      });
    });
  });

  describe('notifyUser', () => {
    const buildingPayload: BuildingCompletedPayload = {
      buildingId: 'building-1',
      villageId: 'village-1',
      buildingType: 'BARRACKS',
      level: 5,
    };

    const battleSentPayload: BattleSentPayload = {
      expeditionId: 'expedition-1',
      villageId: 'village-1',
      targetX: 100,
      targetY: 200,
      targetKind: 'BARBARIAN_VILLAGE',
      arrivalAt: new Date(Date.now() + 300000).toISOString(),
    };

    const battleResolvedPayload: BattleResolvedPayload = {
      expeditionId: 'expedition-1',
      reportId: 'report-1',
      villageId: 'village-1',
      villageName: 'Village One',
      targetKind: 'BARBARIAN_VILLAGE',
      targetName: 'Camp',
      targetX: 100,
      targetY: 200,
      isVictory: true,
      loot: { resources: { wood: 100, stone: 100, iron: 50 } },
      lossesAttacker: { MILITIA: 2 },
      casualtyRate: 0.2,
      survivingUnits: { MILITIA: 8, ARCHER: 5 },
      returnAt: new Date(Date.now() + 600000).toISOString(),
    };

    const resourcesPayload: ResourcesChangedPayload = {
      villageId: 'village1',
      wood: 1500,
      stone: 1200,
      iron: 800,
      maxPerType: 5000,
      lastUpdateTs: new Date().toISOString(),
      productionRates: {
        wood: 600,
        stone: 480,
        iron: 300,
      },
    };

    it('should notify user with event and data', () => {
      // Arrange
      const userId = 'user-1';

      // Act
      gateway.notifyUser(userId, 'building.completed', buildingPayload);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'building.completed',
        buildingPayload,
      );
    });

    it('should notify multiple different users', () => {
      // Arrange
      // Act
      gateway.notifyUser('user-1', 'building.completed', buildingPayload);
      gateway.notifyUser('user-2', 'battle.sent', battleSentPayload);

      // Assert
      expect(mockServer.to).toHaveBeenNthCalledWith(1, 'user:user-1');
      expect(mockServer.to).toHaveBeenNthCalledWith(2, 'user:user-2');
      expect(mockServer.emit).toHaveBeenNthCalledWith(
        1,
        'building.completed',
        buildingPayload,
      );
      expect(mockServer.emit).toHaveBeenNthCalledWith(
        2,
        'battle.sent',
        battleSentPayload,
      );
    });

    it('should handle complex event payload', () => {
      // Arrange
      const userId = 'user-1';

      // Act
      gateway.notifyUser(userId, 'battle.resolved', battleResolvedPayload);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'battle.resolved',
        battleResolvedPayload,
      );
    });

    it('should use correct room name format', () => {
      // Arrange
      const userId = 'user-uuid-550e8400-e29b-41d4-a716';

      // Act
      gateway.notifyUser(userId, 'resources.changed', resourcesPayload);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(
        `user:user-uuid-550e8400-e29b-41d4-a716`,
      );
      expect(mockServer.emit).toHaveBeenCalledWith(
        'resources.changed',
        resourcesPayload,
      );
    });
  });

  describe('notifyWorld', () => {
    it('should notify world with event and data', () => {
      // Arrange
      const worldId = 'world-1';
      const eventData = { barbarianX: 10, barbarianY: 20 };

      // Act
      gateway.notifyWorld(worldId, 'barbarian.spawn', eventData);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith('world:world-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'barbarian.spawn',
        eventData,
      );
    });

    it('should use correct room name format for world', () => {
      // Arrange
      const worldId = 'world-uuid-550e8400-e29b-41d4-a716';

      // Act
      gateway.notifyWorld(worldId, 'test.event', { test: true });

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(
        `world:world-uuid-550e8400-e29b-41d4-a716`,
      );
    });
  });
});
