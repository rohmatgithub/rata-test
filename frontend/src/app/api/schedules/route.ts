import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { extractErrorInfo } from '@/lib/api-utils';
import { gql } from 'graphql-request';

const GET_SCHEDULES = gql`
  query Schedules($pagination: PaginationInput, $filter: ScheduleFilterInput) {
    schedules(pagination: $pagination, filter: $filter) {
      data {
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
      }
      total
      page
      limit
      totalPages
    }
  }
`;

const CREATE_SCHEDULE = gql`
  mutation CreateSchedule($input: CreateScheduleInput!) {
    createSchedule(input: $input) {
      id
      objective
      scheduledAt
      duration
      customer {
        id
        name
      }
      doctor {
        id
        name
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const customerId = searchParams.get('customerId');
    const doctorId = searchParams.get('doctorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter: Record<string, string> = {};
    if (customerId) filter.customerId = customerId;
    if (doctorId) filter.doctorId = doctorId;
    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(GET_SCHEDULES, {
      pagination: { page, limit },
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get schedules error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { objective, customerId, doctorId, scheduledAt, duration } = body;

    if (!objective || !customerId || !doctorId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(CREATE_SCHEDULE, {
      input: {
        objective,
        customerId,
        doctorId,
        scheduledAt,
        duration: duration || 30,
      },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Create schedule error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
  }
}
