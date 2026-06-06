import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input data for creating a new doctor' })
export class CreateDoctorInput {
  @Field({ description: 'Full name of the doctor (minimum 2 characters)' })
  @IsString()
  @MinLength(2)
  name: string;
}
