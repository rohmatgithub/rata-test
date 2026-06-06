import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
`;

interface GraphQLError {
  response?: {
    errors?: Array<{ message: string }>;
  };
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const gqlError = error as GraphQLError;
    if (gqlError.response?.errors?.[0]?.message) {
      return gqlError.response.errors[0].message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Registration failed';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const data = await authClient.request<{
      register: {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string };
      };
    }>(REGISTER_MUTATION, { input: { email, password } });

    const response = NextResponse.json({
      user: data.register.user,
      accessToken: data.register.accessToken,
    });

    response.cookies.set('refreshToken', data.register.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Register error:', error);
    const message = extractErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
