import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

@InputType({ description: 'Input data for creating a new schedule/appointment' })
export class CreateScheduleInput {
  @Field({ description: 'Purpose or reason for the appointment (minimum 3 characters)' })
  @IsString()
  @MinLength(3)
  objective: string;

  @Field({ description: 'UUID of the customer booking the appointment' })
  @IsUUID()
  customerId: string;

  @Field({ description: 'UUID of the doctor for the appointment' })
  @IsUUID()
  doctorId: string;

  @Field({ description: 'Date and time for the appointment (ISO 8601 format)' })
  @IsDateString()
  scheduledAt: string;

  @Field(() => Int, { defaultValue: 30, description: 'Duration of the appointment in minutes (minimum 15, default 30)' })
  @IsInt()
  @Min(15)
  duration: number = 30;
}
