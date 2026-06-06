import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'User entity representing an authenticated user in the system' })
export class User {
  @Field(() => ID, { description: 'Unique identifier for the user' })
  id: string;

  @Field({ description: 'Email address of the user' })
  email: string;

  @Field({ description: 'Timestamp when the user was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the user was last updated' })
  updatedAt: Date;
}
