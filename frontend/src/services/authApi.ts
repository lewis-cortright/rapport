import { appConfig } from '../config/appConfig';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthApiOptions = {
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
};

type AuthApiResponse = {
  ok?: boolean;
  error?: string;
  token?: string;
  user?: AuthUser;
};

/**
 * Error shape surfaced to the UI when an auth API request fails.
 */
export class AuthApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthApiError';
    this.statusCode = statusCode;
  }
}

function resolveFetch(fetchFn?: typeof fetch) {
  return fetchFn ?? window.fetch.bind(window);
}

function buildApiUrl(apiBaseUrl: string, path: string) {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = `/${path.replace(/^\//, '')}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function readJson(response: Response | Pick<Response, 'json'>) {
  try {
    return await response.json() as AuthApiResponse;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: AuthApiResponse | null, fallback: string) {
  return payload?.error || fallback;
}

async function sendAuthRequest(path: string, init: RequestInit, options?: AuthApiOptions) {
  const apiBaseUrl = options?.apiBaseUrl ?? appConfig.apiBaseUrl;
  const fetchFn = resolveFetch(options?.fetchFn);

  let response: Response;

  try {
    response = await fetchFn(buildApiUrl(apiBaseUrl, path), init);
  } catch {
    throw new AuthApiError('Unable to reach the authentication service.', 0);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new AuthApiError(getErrorMessage(payload, 'Authentication request failed.'), response.status);
  }

  return payload;
}

function assertSession(payload: AuthApiResponse | null): AuthSession {
  if (!payload?.token || !payload.user) {
    throw new AuthApiError('Authentication response was incomplete.', 500);
  }

  return {
    token: payload.token,
    user: payload.user
  };
}

function assertUser(payload: AuthApiResponse | null): AuthUser {
  if (!payload?.user) {
    throw new AuthApiError('Current user response was incomplete.', 500);
  }

  return payload.user;
}

/**
 * Submits email/password credentials and returns the authenticated session.
 */
export async function loginWithPassword(credentials: { email: string; password: string }, options?: AuthApiOptions) {
  const payload = await sendAuthRequest(
    '/auth/login',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    },
    options
  );

  return assertSession(payload);
}

/**
 * Creates a new account and returns the authenticated session payload.
 */
export async function registerAccount(input: { username: string; email: string; password: string }, options?: AuthApiOptions) {
  const payload = await sendAuthRequest(
    '/auth/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    },
    options
  );

  return assertSession(payload);
}

/**
 * Loads the current user for an existing bearer token.
 */
export async function fetchCurrentUser(token: string, options?: AuthApiOptions) {
  const payload = await sendAuthRequest(
    '/auth/me',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    options
  );

  return assertUser(payload);
}

