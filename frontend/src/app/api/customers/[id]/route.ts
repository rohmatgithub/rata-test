import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { extractErrorInfo } from '@/lib/api-utils';
import { gql } from 'graphql-request';

const GET_CUSTOMER = gql`
  query Customer($id: ID!) {
    customer(id: $id) {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      name
      email
      updatedAt
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
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
    const data = await client.request(GET_CUSTOMER, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get customer error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = getScheduleClientWithAuth(token);
    const data = await client.request(UPDATE_CUSTOMER, {
      input: { id, ...body },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Update customer error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
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
    const data = await client.request(DELETE_CUSTOMER, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Delete customer error:', error);
    const { message, status } = extractErrorInfo(error);
    return NextResponse.json({ error: message }, { status });
  }
}
