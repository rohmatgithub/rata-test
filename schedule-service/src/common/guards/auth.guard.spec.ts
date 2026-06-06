import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://auth-service:3001'),
  };

  beforeEach(async () => {
    const module = (await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()) as any;

    guard = module.get(AuthGuard);

    jest.clearAllMocks();
  });

  const createMockContext = (headers: Record<string, string> = {}) => {
    const mockReq = {
      headers,
      user: null,
      traceId: null,
    };

    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ req: mockReq }),
    });

    return {} as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no authorization header', async () => {
      const context = createMockContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if invalid authorization format', async () => {
      const context = createMockContext({ authorization: 'InvalidFormat token' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      const context = createMockContext({ authorization: 'Bearer ' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should validate token and set user on request', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const context = createMockContext({ authorization: 'Bearer valid-token' });

      mockHttpService.post.mockReturnValue(
        of({
          data: {
            data: {
              validateToken: mockUser,
            },
          },
        }),
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if auth service returns errors', async () => {
      const context = createMockContext({ authorization: 'Bearer invalid-token' });

      mockHttpService.post.mockReturnValue(
        of({
          data: {
            errors: [{ message: 'Invalid token' }],
          },
        }),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if auth service request fails', async () => {
      const context = createMockContext({ authorization: 'Bearer token' });

      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
