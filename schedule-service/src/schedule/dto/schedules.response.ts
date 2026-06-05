import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Schedule } from './schedule.model';

@ObjectType()
export class SchedulesResponse {
  @Field(() => [Schedule])
  data: Schedule[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
