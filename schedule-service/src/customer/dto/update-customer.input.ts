import { Field, InputType, ID } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

@InputType()
export class UpdateCustomerInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
