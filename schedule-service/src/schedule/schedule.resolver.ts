import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import {
  Schedule,
  CreateScheduleInput,
  ScheduleFilterInput,
  SchedulesResponse,
} from './dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PaginationInput } from '../common/dto/pagination.input';

@Resolver(() => Schedule)
@UseGuards(AuthGuard)
export class ScheduleResolver {
  constructor(private scheduleService: ScheduleService) {}

  @Mutation(() => Schedule, { description: 'Create a new schedule' })
  async createSchedule(
    @Args('input') input: CreateScheduleInput,
  ): Promise<Schedule> {
    return this.scheduleService.create(input);
  }

  @Query(() => SchedulesResponse, { description: 'Get all schedules with filter and pagination' })
  async schedules(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: ScheduleFilterInput,
  ): Promise<SchedulesResponse> {
    return this.scheduleService.findAll(pagination || {}, filter);
  }

  @Query(() => Schedule, { description: 'Get a schedule by ID' })
  async schedule(@Args('id', { type: () => ID }) id: string): Promise<Schedule> {
    return this.scheduleService.findOne(id);
  }

  @Mutation(() => Boolean, { description: 'Delete a schedule' })
  async deleteSchedule(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.scheduleService.remove(id);
  }
}
