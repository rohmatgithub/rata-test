import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Customer } from '../../customer/dto/customer.model';
import { Doctor } from '../../doctor/dto/doctor.model';

@ObjectType()
export class Schedule {
  @Field(() => ID)
  id: string;

  @Field()
  objective: string;

  @Field(() => ID)
  customerId: string;

  @Field(() => Customer)
  customer: Customer;

  @Field(() => ID)
  doctorId: string;

  @Field(() => Doctor)
  doctor: Doctor;

  @Field()
  scheduledAt: Date;

  @Field(() => Int)
  duration: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
