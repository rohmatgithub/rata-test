import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
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
  return 'Login failed';
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

    const data = await authClient.request<{
      login: {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string };
      };
    }>(LOGIN_MUTATION, { input: { email, password } });

    const response = NextResponse.json({
      user: data.login.user,
      accessToken: data.login.accessToken,
    });

    response.cookies.set('refreshToken', data.login.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = extractErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
