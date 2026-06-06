import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    const data = await authClient.request<{
      refreshToken: {
        accessToken: string;
        refreshToken: string;
      };
    }>(REFRESH_TOKEN_MUTATION, { refreshToken });

    const response = NextResponse.json({
      accessToken: data.refreshToken.accessToken,
    });

    response.cookies.set('refreshToken', data.refreshToken.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Refresh token error:', error);
    const response = NextResponse.json(
      { error: 'Session expired' },
      { status: 401 }
    );
    response.cookies.delete('refreshToken');
    return response;
  }
}
