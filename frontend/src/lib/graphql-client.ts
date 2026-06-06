import { GraphQLClient } from 'graphql-request';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/graphql';
const SCHEDULE_SERVICE_URL = process.env.SCHEDULE_SERVICE_URL || 'http://localhost:3002/graphql';

export const authClient = new GraphQLClient(AUTH_SERVICE_URL);

export const scheduleClient = new GraphQLClient(SCHEDULE_SERVICE_URL);

export function getScheduleClientWithAuth(token: string) {
  return new GraphQLClient(SCHEDULE_SERVICE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
