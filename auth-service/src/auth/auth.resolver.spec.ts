import { Test } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module = (await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile()) as any;

    resolver = module.get(AuthResolver);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with input', async () => {
      const input = { email: 'test@example.com', password: 'password123' };
      const expectedResult = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-id', email: input.email },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await resolver.register(input);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(input);
    });
  });

  describe('login', () => {
    it('should call authService.login with input', async () => {
      const input = { email: 'test@example.com', password: 'password123' };
      const expectedResult = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-id', email: input.email },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await resolver.login(input);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(input);
    });
  });

  describe('validateToken', () => {
    it('should call authService.validateToken with token', async () => {
      const token = 'valid-token';
      const expectedResult = { id: 'user-id', email: 'test@example.com' };

      mockAuthService.validateToken.mockResolvedValue(expectedResult);

      const result = await resolver.validateToken(token);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with token', async () => {
      const refreshToken = 'refresh-token';
      const expectedResult = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await resolver.refreshToken(refreshToken);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with token', async () => {
      const refreshToken = 'refresh-token';
      mockAuthService.logout.mockResolvedValue(true);

      const result = await resolver.logout(refreshToken);

      expect(result).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshToken);
    });
  });
});
