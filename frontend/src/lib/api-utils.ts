interface GraphQLError {
  response?: {
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
  };
}

export function extractErrorInfo(error: unknown): { message: string; status: number } {
  if (error && typeof error === 'object') {
    const gqlError = error as GraphQLError;
    const firstError = gqlError.response?.errors?.[0];
    if (firstError) {
      const isAuthError = firstError.extensions?.code === 'UNAUTHENTICATED';
      return {
        message: firstError.message,
        status: isAuthError ? 401 : 500,
      };
    }
  }
  return {
    message: error instanceof Error ? error.message : 'An error occurred',
    status: 500,
  };
}
