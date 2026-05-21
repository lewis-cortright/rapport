import { describe, expect, it, vi } from 'vitest';
import { MessageApiError, createMessage, fetchMessages } from './messageApi';

// ---------------------------------------------------------------------------
// Response factory
// ---------------------------------------------------------------------------

function createResponse(payload: unknown, overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn(async () => payload),
    ...overrides
  } as unknown as Response;
}

const BASE = 'https://api.example.test';

const TEST_AUTHOR = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com'
};

const TEST_MESSAGE = {
  id: 'msg-1',
  workspaceId: 'ws-1',
  channelId: 'ch-1',
  author: TEST_AUTHOR,
  content: 'Hello world',
  createdAt: '2026-05-21T10:00:00.000Z',
  updatedAt: '2026-05-21T10:00:00.000Z'
};

// ---------------------------------------------------------------------------
// fetchMessages
// ---------------------------------------------------------------------------

describe('fetchMessages', () => {
  it('sends a GET request with a bearer token and returns the message list', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(`${BASE}/workspaces/ws-1/channels/ch-1/messages`);
      expect(init?.method).toBe('GET');
      expect((init?.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt.token');

      return createResponse({ ok: true, messages: [TEST_MESSAGE] });
    });

    await expect(
      fetchMessages('ws-1', 'ch-1', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).resolves.toEqual([TEST_MESSAGE]);
  });

  it('throws when the response is not ok', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        { ok: false, error: 'Channel not found.' },
        { ok: false, status: 404 }
      )
    );

    await expect(
      fetchMessages('ws-1', 'ch-x', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Channel not found.', 404));
  });

  it('falls back to a generic error message when the error payload is empty', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse({}, { ok: false, status: 500 })
    );

    await expect(
      fetchMessages('ws-1', 'ch-1', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Message request failed.', 500));
  });

  it('throws a network error when fetch rejects', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network down');
    });

    await expect(
      fetchMessages('ws-1', 'ch-1', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Unable to reach the message service.', 0));
  });

  it('throws when the success response does not include a messages array', async () => {
    const fetchFn = vi.fn(async () => createResponse({ ok: true }));

    await expect(
      fetchMessages('ws-1', 'ch-1', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Message list response was incomplete.', 500));
  });

  it('uses the default api base url and window.fetch when no options are provided', async () => {
    const originalFetch = window.fetch;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBe('/api/workspaces/ws-1/channels/ch-1/messages');
      return createResponse({ ok: true, messages: [TEST_MESSAGE] });
    });

    window.fetch = fetchSpy as typeof window.fetch;

    try {
      await expect(fetchMessages('ws-1', 'ch-1', 'jwt.token')).resolves.toEqual([TEST_MESSAGE]);
    } finally {
      window.fetch = originalFetch;
    }
  });

  it('falls back to an empty string error when the error JSON cannot be parsed', async () => {
    const fetchFn = vi.fn(async () =>
      ({
        ok: false,
        status: 503,
        json: vi.fn(async () => {
          throw new Error('not json');
        })
      }) as unknown as Response
    );

    await expect(
      fetchMessages('ws-1', 'ch-1', 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Message request failed.', 503));
  });
});

// ---------------------------------------------------------------------------
// createMessage
// ---------------------------------------------------------------------------

describe('createMessage', () => {
  it('sends a POST request with JSON body and bearer token', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(`${BASE}/workspaces/ws-1/channels/ch-1/messages`);
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect((init?.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt.token');
      expect(init?.body).toBe(JSON.stringify({ content: 'Hello world' }));

      return createResponse({ ok: true, message: TEST_MESSAGE });
    });

    await expect(
      createMessage('ws-1', 'ch-1', { content: 'Hello world' }, 'jwt.token', {
        apiBaseUrl: BASE,
        fetchFn
      })
    ).resolves.toEqual(TEST_MESSAGE);
  });

  it('throws when creating a message fails with an API error', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        { ok: false, error: 'Message content is required.' },
        { ok: false, status: 400 }
      )
    );

    await expect(
      createMessage('ws-1', 'ch-1', { content: '' }, 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Message content is required.', 400));
  });

  it('throws when the success response does not include a message object', async () => {
    const fetchFn = vi.fn(async () => createResponse({ ok: true }));

    await expect(
      createMessage('ws-1', 'ch-1', { content: 'Hi' }, 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Message response was incomplete.', 500));
  });

  it('throws a network error when fetch rejects', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('offline');
    });

    await expect(
      createMessage('ws-1', 'ch-1', { content: 'Hi' }, 'jwt.token', { apiBaseUrl: BASE, fetchFn })
    ).rejects.toEqual(new MessageApiError('Unable to reach the message service.', 0));
  });
});

// ---------------------------------------------------------------------------
// MessageApiError
// ---------------------------------------------------------------------------

describe('MessageApiError', () => {
  it('stores the message and status code', () => {
    const err = new MessageApiError('Not found.', 404);

    expect(err.message).toBe('Not found.');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('MessageApiError');
    expect(err).toBeInstanceOf(Error);
  });
});

