import { appConfig } from '../config/appConfig';

export type ChannelSummary = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ChannelApiOptions = {
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
};

type ChannelApiResponse = {
  ok?: boolean;
  error?: string;
  channel?: ChannelSummary;
  channels?: ChannelSummary[];
};

export class ChannelApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ChannelApiError';
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
    return await response.json() as ChannelApiResponse;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: ChannelApiResponse | null, fallback: string) {
  return payload?.error || fallback;
}

async function sendChannelRequest(path: string, token: string, init: RequestInit, options?: ChannelApiOptions) {
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
    throw new ChannelApiError('Unable to reach the channel service.', 0);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new ChannelApiError(getErrorMessage(payload, 'Channel request failed.'), response.status);
  }

  return payload;
}

function assertChannel(payload: ChannelApiResponse | null): ChannelSummary {
  if (!payload?.channel) {
    throw new ChannelApiError('Channel response was incomplete.', 500);
  }

  return payload.channel;
}

function assertChannels(payload: ChannelApiResponse | null): ChannelSummary[] {
  if (!payload?.channels) {
    throw new ChannelApiError('Channel list response was incomplete.', 500);
  }

  return payload.channels;
}

export async function fetchChannels(workspaceId: string, token: string, options?: ChannelApiOptions) {
  const payload = await sendChannelRequest(`/workspaces/${workspaceId}/channels`, token, { method: 'GET' }, options);

  return assertChannels(payload);
}

export async function createChannel(workspaceId: string, input: { name: string }, token: string, options?: ChannelApiOptions) {
  const payload = await sendChannelRequest(
    `/workspaces/${workspaceId}/channels`,
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

  return assertChannel(payload);
}

