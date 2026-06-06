import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Customer entity representing a patient in the healthcare system' })
export class Customer {
  @Field(() => ID, { description: 'Unique identifier for the customer' })
  id: string;

  @Field({ description: 'Full name of the customer' })
  name: string;

  @Field({ description: 'Email address of the customer (unique)' })
  email: string;

  @Field({ description: 'Timestamp when the customer was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the customer was last updated' })
  updatedAt: Date;
}
