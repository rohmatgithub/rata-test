import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomersResponse,
} from './dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PaginationInput } from '../common/dto/pagination.input';

@Resolver(() => Customer)
@UseGuards(AuthGuard)
export class CustomerResolver {
  constructor(private customerService: CustomerService) {}

  @Mutation(() => Customer, { description: 'Create a new customer' })
  async createCustomer(
    @Args('input') input: CreateCustomerInput,
  ): Promise<Customer> {
    return this.customerService.create(input);
  }

  @Query(() => CustomersResponse, { description: 'Get all customers with pagination' })
  async customers(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<CustomersResponse> {
    return this.customerService.findAll(pagination || {});
  }

  @Query(() => Customer, { description: 'Get a customer by ID' })
  async customer(@Args('id', { type: () => ID }) id: string): Promise<Customer> {
    return this.customerService.findOne(id);
  }

  @Mutation(() => Customer, { description: 'Update a customer' })
  async updateCustomer(
    @Args('input') input: UpdateCustomerInput,
  ): Promise<Customer> {
    return this.customerService.update(input);
  }

  @Mutation(() => Boolean, { description: 'Delete a customer' })
  async deleteCustomer(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.customerService.remove(id);
  }
}
