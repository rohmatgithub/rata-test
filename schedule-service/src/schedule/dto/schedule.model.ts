import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Customer } from '../../customer/dto/customer.model';
import { Doctor } from '../../doctor/dto/doctor.model';

@ObjectType({ description: 'Schedule entity representing an appointment between a customer and doctor' })
export class Schedule {
  @Field(() => ID, { description: 'Unique identifier for the schedule' })
  id: string;

  @Field({ description: 'Purpose or reason for the appointment' })
  objective: string;

  @Field(() => ID, { description: 'ID of the customer who booked the appointment' })
  customerId: string;

  @Field(() => Customer, { description: 'Customer details for this schedule' })
  customer: Customer;

  @Field(() => ID, { description: 'ID of the doctor for the appointment' })
  doctorId: string;

  @Field(() => Doctor, { description: 'Doctor details for this schedule' })
  doctor: Doctor;

  @Field({ description: 'Date and time when the appointment is scheduled' })
  scheduledAt: Date;

  @Field(() => Int, { description: 'Duration of the appointment in minutes' })
  duration: number;

  @Field({ description: 'Timestamp when the schedule was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the schedule was last updated' })
  updatedAt: Date;
}
