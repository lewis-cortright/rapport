import { appConfig } from '../config/appConfig';

export type MessageAuthor = {
  id: string;
  username: string;
  email: string;
};

export type MessageSummary = {
  id: string;
  workspaceId: string;
  channelId: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type MessageApiOptions = {
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
};

type MessageApiResponse = {
  ok?: boolean;
  error?: string;
  message?: MessageSummary;
  messages?: MessageSummary[];
};

export class MessageApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'MessageApiError';
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
    return (await response.json()) as MessageApiResponse;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: MessageApiResponse | null, fallback: string) {
  return payload?.error || fallback;
}

async function sendMessageRequest(path: string, token: string, init: RequestInit, options?: MessageApiOptions) {
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
    throw new MessageApiError('Unable to reach the message service.', 0);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new MessageApiError(getErrorMessage(payload, 'Message request failed.'), response.status);
  }

  return payload;
}

function assertMessage(payload: MessageApiResponse | null): MessageSummary {
  if (!payload?.message) {
    throw new MessageApiError('Message response was incomplete.', 500);
  }

  return payload.message;
}

function assertMessages(payload: MessageApiResponse | null): MessageSummary[] {
  if (!payload?.messages) {
    throw new MessageApiError('Message list response was incomplete.', 500);
  }

  return payload.messages;
}

export async function fetchMessages(workspaceId: string, channelId: string, token: string, options?: MessageApiOptions) {
  const payload = await sendMessageRequest(`/workspaces/${workspaceId}/channels/${channelId}/messages`, token, { method: 'GET' }, options);

  return assertMessages(payload);
}

export async function createMessage(
  workspaceId: string,
  channelId: string,
  input: { content: string },
  token: string,
  options?: MessageApiOptions
) {
  const payload = await sendMessageRequest(
    `/workspaces/${workspaceId}/channels/${channelId}/messages`,
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

  return assertMessage(payload);
}

