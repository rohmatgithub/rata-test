import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input data for creating a new customer' })
export class CreateCustomerInput {
  @Field({ description: 'Full name of the customer (minimum 2 characters)' })
  @IsString()
  @MinLength(2)
  name: string;

  @Field({ description: 'Email address of the customer (must be unique)' })
  @IsEmail()
  email: string;
}
