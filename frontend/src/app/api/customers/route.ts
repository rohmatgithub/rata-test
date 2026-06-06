import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const GET_CUSTOMERS = gql`
  query Customers($pagination: PaginationInput) {
    customers(pagination: $pagination) {
      data {
        id
        name
        email
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      email
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
    const data = await client.request(GET_CUSTOMERS, {
      pagination: { page, limit },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get customers error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch customers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(CREATE_CUSTOMER, {
      input: { name, email },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Create customer error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create customer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
