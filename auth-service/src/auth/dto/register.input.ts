import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input data for user registration' })
export class RegisterInput {
  @Field({ description: 'Email address for the new account' })
  @IsEmail()
  email: string;

  @Field({ description: 'Password for the new account (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}
