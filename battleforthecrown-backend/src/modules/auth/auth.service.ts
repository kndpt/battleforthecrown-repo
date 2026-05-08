import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as bcrypt from 'bcrypt';
import { MS_PER_DAY } from '@battleforthecrown/shared/time';

const REFRESH_TOKEN_TTL_MS = 7 * MS_PER_DAY;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: dto.email, password: hashedPassword },
        });

        const { accessToken, refreshToken } = await this.generateTokens(
          user.id,
          tx,
        );

        return {
          accessToken,
          refreshToken,
          userId: user.id,
          email: user.email,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        villages: {
          take: 1,
        },
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    return {
      accessToken,
      refreshToken,
      userId: user.id,
      email: user.email,
      villageId: user.villages[0]?.id,
    };
  }

  private async generateTokens(
    userId: string,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '7d' },
    );

    await prisma.session.create({
      data: {
        userId,
        refreshToken: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(dto: RefreshDto) {
    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        userId: decoded.sub,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!session) {
      throw new UnauthorizedException('No active session found');
    }

    const isValidRefreshToken = await bcrypt.compare(
      dto.refreshToken,
      session.refreshToken,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Générer un nouvel accessToken
    const accessToken = this.jwtService.sign(
      { sub: session.userId },
      { expiresIn: '15m' },
    );

    return {
      accessToken,
      refreshToken: dto.refreshToken,
    };
  }
}
