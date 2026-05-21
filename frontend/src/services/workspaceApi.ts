import { appConfig } from '../config/appConfig';

export type WorkspaceRole = 'owner' | 'member';

export type WorkspaceSummary = {
  id: string;
  name: string;
  inviteCode: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceApiOptions = {
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
};

type WorkspaceApiResponse = {
  ok?: boolean;
  error?: string;
  workspace?: WorkspaceSummary;
  workspaces?: WorkspaceSummary[];
};

/**
 * Error shape surfaced to the UI when a workspace API request fails.
 */
export class WorkspaceApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'WorkspaceApiError';
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
    return await response.json() as WorkspaceApiResponse;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: WorkspaceApiResponse | null, fallback: string) {
  return payload?.error || fallback;
}

async function sendWorkspaceRequest(path: string, token: string, init: RequestInit, options?: WorkspaceApiOptions) {
  const apiBaseUrl = options?.apiBaseUrl ?? appConfig.apiBaseUrl;
  const fetchFn = resolveFetch(options?.fetchFn);

  let response: Response;

  try {
    response = await fetchFn(buildApiUrl(apiBaseUrl, path), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {})
      }
    });
  } catch {
    throw new WorkspaceApiError('Unable to reach the workspace service.', 0);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new WorkspaceApiError(getErrorMessage(payload, 'Workspace request failed.'), response.status);
  }

  return payload;
}

function assertWorkspace(payload: WorkspaceApiResponse | null): WorkspaceSummary {
  if (!payload?.workspace) {
    throw new WorkspaceApiError('Workspace response was incomplete.', 500);
  }

  return payload.workspace;
}

function assertWorkspaces(payload: WorkspaceApiResponse | null): WorkspaceSummary[] {
  if (!payload?.workspaces) {
    throw new WorkspaceApiError('Workspace list response was incomplete.', 500);
  }

  return payload.workspaces;
}

/**
 * Loads the authenticated user's workspace sidebar data.
 */
export async function fetchWorkspaces(token: string, options?: WorkspaceApiOptions) {
  const payload = await sendWorkspaceRequest(
    '/workspaces',
    token,
    {
      method: 'GET'
    },
    options
  );

  return assertWorkspaces(payload);
}

/**
 * Creates a new workspace and returns the created summary payload.
 */
export async function createWorkspace(input: { name: string }, token: string, options?: WorkspaceApiOptions) {
  const payload = await sendWorkspaceRequest(
    '/workspaces',
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    },
    options
  );

  return assertWorkspace(payload);
}

/**
 * Joins an existing workspace by invite code and returns the refreshed summary.
 */
export async function joinWorkspace(input: { inviteCode: string }, token: string, options?: WorkspaceApiOptions) {
  const payload = await sendWorkspaceRequest(
    '/workspaces/join',
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    },
    options
  );

  return assertWorkspace(payload);
}

