import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  RefreshTokenResponse,
  User,
} from './dto';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse, { description: 'Register a new user' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse, { description: 'Login with email and password' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Query(() => User, { description: 'Validate token and return user info' })
  async validateToken(@Args('token') token: string): Promise<User> {
    return this.authService.validateToken(token);
  }

  @Mutation(() => RefreshTokenResponse, { description: 'Refresh access token using refresh token' })
  async refreshToken(
    @Args('refreshToken') refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(refreshToken);
  }

  @Mutation(() => Boolean, { description: 'Logout and invalidate refresh token' })
  async logout(@Args('refreshToken') refreshToken: string): Promise<boolean> {
    return this.authService.logout(refreshToken);
  }
}
