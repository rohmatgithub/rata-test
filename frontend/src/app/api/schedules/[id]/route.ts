import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const GET_SCHEDULE = gql`
  query Schedule($id: ID!) {
    schedule(id: $id) {
      id
      objective
      scheduledAt
      duration
      customer {
        id
        name
        email
      }
      doctor {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

const DELETE_SCHEDULE = gql`
  mutation DeleteSchedule($id: ID!) {
    deleteSchedule(id: $id)
  }
`;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = getScheduleClientWithAuth(token);
    const data = await client.request(GET_SCHEDULE, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get schedule error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = getScheduleClientWithAuth(token);
    const data = await client.request(DELETE_SCHEDULE, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Delete schedule error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
