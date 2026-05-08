import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn<Promise<string>, [string, string | number]>(),
  compare: jest.fn<Promise<boolean>, [string, string]>(),
}));

describe('AuthService', () => {
  let service: AuthService;
  type TransactionCallback = (tx: Prisma.TransactionClient) => Promise<unknown>;

  type PrismaServiceMock = {
    user: {
      findUnique: jest.Mock<
        Promise<{
          id: string;
          email: string;
          password: string;
          villages: Array<{ id: string }>;
        } | null>,
        [Prisma.UserFindUniqueArgs]
      >;
      create: jest.Mock<
        Promise<{
          id: string;
          email: string;
        }>,
        [Prisma.UserCreateArgs]
      >;
    };
    session: {
      findFirst: jest.Mock<
        Promise<{
          id: string;
          userId: string;
          refreshToken: string;
          expiresAt: Date;
          user: { id: string; email: string };
        } | null>,
        [Prisma.SessionFindFirstArgs]
      >;
      create: jest.Mock<Promise<void>, [Prisma.SessionCreateArgs]>;
    };
    $transaction: jest.Mock<Promise<unknown>, [TransactionCallback]>;
  };

  let prismaService: PrismaServiceMock;
  let jwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const bcryptHashMock = mockedBcrypt.hash as jest.MockedFunction<
    typeof bcrypt.hash
  >;
  const bcryptCompareMock = mockedBcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn<
          Promise<{
            id: string;
            email: string;
            password: string;
            villages: Array<{ id: string }>;
          } | null>,
          [Prisma.UserFindUniqueArgs]
        >(),
        create: jest.fn<
          Promise<{
            id: string;
            email: string;
          }>,
          [Prisma.UserCreateArgs]
        >(),
      },
      session: {
        findFirst: jest.fn<
          Promise<{
            id: string;
            userId: string;
            refreshToken: string;
            expiresAt: Date;
            user: { id: string; email: string };
          } | null>,
          [Prisma.SessionFindFirstArgs]
        >(),
        create: jest.fn<Promise<void>, [Prisma.SessionCreateArgs]>(),
      },
      $transaction: jest.fn<Promise<unknown>, [TransactionCallback]>(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<AuthService>(AuthService);

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user and create session tokens', async () => {
      const dto = { email: 'user@example.com', password: 'password123' };
      const user = { id: 'user-1', email: dto.email };

      bcryptHashMock.mockResolvedValueOnce('hashed-password' as never);
      bcryptHashMock.mockResolvedValueOnce('hashed-refresh-token' as never);

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const transactionUserCreateMock = jest
        .fn<Promise<typeof user>, [Prisma.UserCreateArgs]>()
        .mockResolvedValue(user);
      const transactionSessionCreateMock = jest
        .fn<Promise<void>, [Prisma.SessionCreateArgs]>()
        .mockResolvedValue(undefined);

      const transactionClient = {
        user: {
          create: transactionUserCreateMock,
        },
        session: {
          create: transactionSessionCreateMock,
        },
      };

      prismaService.$transaction.mockImplementation(
        (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
          callback(transactionClient as unknown as Prisma.TransactionClient),
      );

      const result = await service.register(dto);

      expect(transactionUserCreateMock).toHaveBeenCalledWith({
        data: { email: dto.email, password: 'hashed-password' },
      });
      expect(transactionSessionCreateMock).toHaveBeenCalledTimes(1);
      const [[sessionCreateArgs]] = transactionSessionCreateMock.mock.calls;
      expect(sessionCreateArgs.data.userId).toBe(user.id);
      expect(sessionCreateArgs.data.refreshToken).toBe('hashed-refresh-token');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: user.id,
        email: dto.email,
      });
      expect(bcryptHashMock).toHaveBeenNthCalledWith(1, dto.password, 10);
      expect(bcryptHashMock).toHaveBeenNthCalledWith(2, 'refresh-token', 10);
    });

    it('should throw ConflictException when email already exists', async () => {
      const dto = { email: 'user@example.com', password: 'password123' };

      const prismaError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      }) as unknown as Prisma.PrismaClientKnownRequestError;
      Object.setPrototypeOf(
        prismaError,
        Prisma.PrismaClientKnownRequestError.prototype,
      );
      prismaService.$transaction.mockRejectedValue(prismaError);

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      const dto = { email: 'user@example.com', password: 'password123' };
      const user = {
        id: 'user-1',
        email: dto.email,
        password: 'stored-hash',
        villages: [{ id: 'village-1' }],
      };

      prismaService.user.findUnique.mockResolvedValue(user);

      bcryptCompareMock.mockResolvedValueOnce(true as never);
      bcryptHashMock.mockResolvedValueOnce('hashed-refresh-token' as never);

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(dto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
        include: { villages: { take: 1 } },
      });
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        dto.password,
        user.password,
      );
      expect(prismaService.session.create).toHaveBeenCalledTimes(1);
      const [[sessionCreateArgs]] = prismaService.session.create.mock.calls;
      expect(sessionCreateArgs.data.userId).toBe(user.id);
      expect(sessionCreateArgs.data.refreshToken).toBe('hashed-refresh-token');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: user.id,
        email: dto.email,
        villageId: 'village-1',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        password: 'stored-hash',
        villages: [],
      };

      prismaService.user.findUnique.mockResolvedValue(user);
      bcryptCompareMock.mockResolvedValue(false as never);

      await expect(
        service.login({ email: user.email, password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should issue a new access token when refresh token is valid', async () => {
      const dto = { refreshToken: 'valid-refresh-token' };
      const session = {
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'stored-refresh-hash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: 'user-1', email: 'user@example.com' },
      };

      jwtService.verify.mockReturnValue({ sub: session.userId });
      prismaService.session.findFirst.mockResolvedValue(session);
      bcryptCompareMock.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh(dto);

      expect(jwtService.verify).toHaveBeenCalledWith(dto.refreshToken);
      expect(prismaService.session.findFirst).toHaveBeenCalledTimes(1);
      const [[sessionFindFirstArgs]] =
        prismaService.session.findFirst.mock.calls;
      expect(sessionFindFirstArgs.where?.userId).toBe(session.userId);
      expect(sessionFindFirstArgs.include).toEqual({ user: true });
      expect(sessionFindFirstArgs.orderBy).toEqual({ createdAt: 'desc' });
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        dto.refreshToken,
        session.refreshToken,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: session.userId },
        { expiresIn: '15m' },
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: dto.refreshToken,
      });
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no active session found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      prismaService.session.findFirst.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token hash does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      prismaService.session.findFirst.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'stored-refresh-hash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: { id: 'user-1', email: 'user@example.com' },
      });
      bcryptCompareMock.mockResolvedValue(false as never);

      await expect(
        service.refresh({ refreshToken: 'token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
