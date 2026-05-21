import { describe, expect, it, vi } from 'vitest';
import { ChannelApiError, createChannel, fetchChannels } from './channelApi';

function createResponse(payload: unknown, overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn(async () => payload),
    ...overrides
  } as unknown as Response;
}

describe('channelApi', () => {
  it('loads workspace channels with a bearer token', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://api.example.test/workspaces/workspace-1/channels');
      expect(init).toMatchObject({ method: 'GET' });
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.token'
      });

      return createResponse({
        ok: true,
        channels: [
          {
            id: 'channel-1',
            workspaceId: 'workspace-1',
            name: 'general',
            createdAt: '2026-05-23T00:00:00.000Z',
            updatedAt: '2026-05-23T00:00:00.000Z'
          }
        ]
      });
    });

    await expect(fetchChannels('workspace-1', 'jwt.token', { apiBaseUrl: 'https://api.example.test/', fetchFn })).resolves.toEqual([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
  });

  it('creates channels with the configured workspace endpoint', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://api.example.test/workspaces/workspace-1/channels');
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.token',
        'Content-Type': 'application/json'
      });
      expect(init?.body).toBe(JSON.stringify({ name: 'frontend' }));

      return createResponse({
        ok: true,
        channel: {
          id: 'channel-2',
          workspaceId: 'workspace-1',
          name: 'frontend',
          createdAt: '2026-05-23T00:05:00.000Z',
          updatedAt: '2026-05-23T00:05:00.000Z'
        }
      });
    });

    await expect(createChannel('workspace-1', { name: 'frontend' }, 'jwt.token', { apiBaseUrl: 'https://api.example.test', fetchFn })).resolves.toEqual({
      id: 'channel-2',
      workspaceId: 'workspace-1',
      name: 'frontend',
      createdAt: '2026-05-23T00:05:00.000Z',
      updatedAt: '2026-05-23T00:05:00.000Z'
    });
  });

  it('throws API error messages for unsuccessful requests', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        {
          ok: false,
          error: 'Only workspace owners can create channels.'
        },
        {
          ok: false,
          status: 403
        }
      )
    );

    await expect(createChannel('workspace-1', { name: 'frontend' }, 'jwt.token', { apiBaseUrl: '/api', fetchFn })).rejects.toEqual(
      new ChannelApiError('Only workspace owners can create channels.', 403)
    );
  });

  it('falls back to generic messages for malformed success payloads and non-JSON errors', async () => {
    const incompleteListFetch = vi.fn(async () => createResponse({ ok: true }));
    const incompleteChannelFetch = vi.fn(async () => createResponse({ ok: true }));
    const nonJsonErrorFetch = vi.fn(async () =>
      ({
        ok: false,
        status: 500,
        json: vi.fn(async () => {
          throw new Error('not json');
        })
      }) as unknown as Response
    );

    await expect(fetchChannels('workspace-1', 'jwt.token', { apiBaseUrl: '/api', fetchFn: incompleteListFetch })).rejects.toEqual(
      new ChannelApiError('Channel list response was incomplete.', 500)
    );
    await expect(createChannel('workspace-1', { name: 'frontend' }, 'jwt.token', { apiBaseUrl: '/api', fetchFn: incompleteChannelFetch })).rejects.toEqual(
      new ChannelApiError('Channel response was incomplete.', 500)
    );
    await expect(fetchChannels('workspace-1', 'jwt.token', { apiBaseUrl: '/api', fetchFn: nonJsonErrorFetch })).rejects.toEqual(
      new ChannelApiError('Channel request failed.', 500)
    );
  });

  it('surfaces network failures with a consistent offline-style message and uses window.fetch by default', async () => {
    const networkFailureFetch = vi.fn(async () => {
      throw new Error('offline');
    });

    await expect(fetchChannels('workspace-1', 'jwt.token', { apiBaseUrl: '/api', fetchFn: networkFailureFetch })).rejects.toEqual(
      new ChannelApiError('Unable to reach the channel service.', 0)
    );

    const originalFetch = window.fetch;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('/api/workspaces/workspace-1/channels');
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.default'
      });

      return createResponse({
        ok: true,
        channels: []
      });
    });

    window.fetch = fetchSpy as typeof window.fetch;

    try {
      await expect(fetchChannels('workspace-1', 'jwt.default')).resolves.toEqual([]);
    } finally {
      window.fetch = originalFetch;
    }
  });
});

