import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import {
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
  DoctorsResponse,
} from './dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PaginationInput } from '../common/dto/pagination.input';

@Resolver(() => Doctor)
@UseGuards(AuthGuard)
export class DoctorResolver {
  constructor(private doctorService: DoctorService) {}

  @Mutation(() => Doctor, { description: 'Create a new doctor' })
  async createDoctor(
    @Args('input') input: CreateDoctorInput,
  ): Promise<Doctor> {
    return this.doctorService.create(input);
  }

  @Query(() => DoctorsResponse, { description: 'Get all doctors with pagination' })
  async doctors(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<DoctorsResponse> {
    return this.doctorService.findAll(pagination || {});
  }

  @Query(() => Doctor, { description: 'Get a doctor by ID' })
  async doctor(@Args('id', { type: () => ID }) id: string): Promise<Doctor> {
    return this.doctorService.findOne(id);
  }

  @Mutation(() => Doctor, { description: 'Update a doctor' })
  async updateDoctor(
    @Args('input') input: UpdateDoctorInput,
  ): Promise<Doctor> {
    return this.doctorService.update(input);
  }

  @Mutation(() => Boolean, { description: 'Delete a doctor' })
  async deleteDoctor(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.doctorService.remove(id);
  }
}
