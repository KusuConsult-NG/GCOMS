import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * The token is read from the auth store — the same value ClientAuthWrapper gates
 * on — so the UI and the API can never disagree about whether you are signed in.
 *
 * This previously read a separate localStorage['token'] key that setAuth wrote
 * alongside the persisted store: two copies of one fact. When they diverged, or
 * when the JWT simply expired, the store still held a token so the app rendered
 * as authenticated while every request went out unauthenticated and came back
 * 401. Nothing detected that, so the app looked signed in and silently failed.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * A 401 means the session is over — expired, revoked, or the account was
 * deactivated. Tokens last 60 minutes and there is no refresh, so this is a
 * routine event during a working day rather than an edge case. End the session
 * cleanly instead of leaving a signed-in shell that fails every request.
 *
 * 403 is deliberately not handled here: that is a live session being told it
 * lacks permission, which the pages surface themselves.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) {
        // As with logout: a full reload is what discards the data the expired
        // token was used to fetch. This is also outside a component, so the
        // router hook is not available here anyway.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
);
