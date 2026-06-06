import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType({ description: 'Input data for user login' })
export class LoginInput {
  @Field({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @Field({ description: 'Password of the user' })
  @IsString()
  password: string;
}
