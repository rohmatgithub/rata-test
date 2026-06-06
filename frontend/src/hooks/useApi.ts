'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export function useApi() {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let token = accessToken;

      const makeRequest = async (authToken: string | null) => {
        const headers = new Headers(options.headers);
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }
        headers.set('Content-Type', 'application/json');

        return fetch(url, {
          ...options,
          headers,
        });
      };

      let response = await makeRequest(token);

      if (response.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          response = await makeRequest(token);
          if (response.status === 401) {
            await logout();
            throw new Error('Session expired. Please login again.');
          }
        } else {
          await logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      return response;
    },
    [accessToken, refreshAccessToken, logout]
  );

  return { fetchWithAuth };
}
