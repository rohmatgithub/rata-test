import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType({ description: 'Authentication response containing tokens and user info' })
export class AuthResponse {
  @Field({ description: 'JWT access token for API authentication' })
  accessToken: string;

  @Field({ description: 'JWT refresh token for obtaining new access tokens' })
  refreshToken: string;

  @Field(() => User, { description: 'Authenticated user information' })
  user: User;
}

@ObjectType({ description: 'Response containing refreshed tokens' })
export class RefreshTokenResponse {
  @Field({ description: 'New JWT access token' })
  accessToken: string;

  @Field({ description: 'New JWT refresh token' })
  refreshToken: string;
}
