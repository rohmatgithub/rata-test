import { NextRequest, NextResponse } from 'next/server';
import { getScheduleClientWithAuth } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const GET_DOCTOR = gql`
  query Doctor($id: ID!) {
    doctor(id: $id) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_DOCTOR = gql`
  mutation UpdateDoctor($input: UpdateDoctorInput!) {
    updateDoctor(input: $input) {
      id
      name
      updatedAt
    }
  }
`;

const DELETE_DOCTOR = gql`
  mutation DeleteDoctor($id: ID!) {
    deleteDoctor(id: $id)
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
    const data = await client.request(GET_DOCTOR, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Get doctor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch doctor';
    return NextResponse.json({ error: message }, { status: 500 });
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
    const data = await client.request(UPDATE_DOCTOR, {
      input: { id, ...body },
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Update doctor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update doctor';
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
    const data = await client.request(DELETE_DOCTOR, { id });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Delete doctor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete doctor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
