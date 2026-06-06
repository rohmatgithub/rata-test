import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { extractErrorInfo } from '@/lib/api-utils';
import { gql } from 'graphql-request';

const GET_DOCTORS = gql`
  query Doctors($pagination: PaginationInput) {
    doctors(pagination: $pagination) {
      data {
        id
        name
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

const CREATE_DOCTOR = gql`
  mutation CreateDoctor($input: CreateDoctorInput!) {
    createDoctor(input: $input) {
      id
      name
      createdAt
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

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(GET_DOCTORS, {
      pagination: { page, limit },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get doctors error:', error);
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(CREATE_DOCTOR, {
      input: { name },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Create doctor error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
  }
}
