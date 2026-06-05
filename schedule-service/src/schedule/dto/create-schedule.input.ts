import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

@InputType()
export class CreateScheduleInput {
  @Field()
  @IsString()
  @MinLength(3)
  objective: string;

  @Field()
  @IsUUID()
  customerId: string;

  @Field()
  @IsUUID()
  doctorId: string;

  @Field()
  @IsDateString()
  scheduledAt: string;

  @Field(() => Int, { defaultValue: 30 })
  @IsInt()
  @Min(15)
  duration: number = 30;
}
