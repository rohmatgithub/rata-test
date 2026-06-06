import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        REFRESH_TOKEN_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: 'user-id',
        email: registerInput.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: loginInput.email,
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginInput.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginInput)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate token and return user', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-token');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const mockStoredToken = {
      id: 'token-id',
      token: 'refresh-token',
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 86400000),
      user: {
        id: 'user-id',
        email: 'test@example.com',
      },
    };

    it('should refresh token successfully', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken('refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token expired', async () => {
      const expiredToken = {
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 86400000),
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('refresh-token');

      expect(result).toBe(true);
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'refresh-token' },
      });
    });
  });
});
