import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Doctor entity representing a healthcare provider' })
export class Doctor {
  @Field(() => ID, { description: 'Unique identifier for the doctor' })
  id: string;

  @Field({ description: 'Full name of the doctor' })
  name: string;

  @Field({ description: 'Timestamp when the doctor was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the doctor was last updated' })
  updatedAt: Date;
}
