import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';

const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      try {
        await authClient.request(LOGOUT_MUTATION, { refreshToken });
      } catch {
        // Ignore errors during logout
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('refreshToken');
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('refreshToken');
    return response;
  }
}
