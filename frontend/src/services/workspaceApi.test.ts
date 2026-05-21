import { describe, expect, it, vi } from 'vitest';
import { WorkspaceApiError, createWorkspace, fetchWorkspaces, joinWorkspace } from './workspaceApi';

function createResponse(payload: unknown, overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn(async () => payload),
    ...overrides
  } as unknown as Response;
}

describe('workspaceApi', () => {
  it('loads the authenticated user workspaces with a bearer token', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://api.example.test/workspaces');
      expect(init).toMatchObject({ method: 'GET' });
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.token'
      });

      return createResponse({
        ok: true,
        workspaces: [
          {
            id: 'workspace-1',
            name: 'Rapport Core',
            inviteCode: 'CORE1234',
            role: 'owner',
            memberCount: 1,
            createdAt: '2026-05-21T00:00:00.000Z',
            updatedAt: '2026-05-21T00:00:00.000Z'
          }
        ]
      });
    });

    await expect(fetchWorkspaces('jwt.token', { apiBaseUrl: 'https://api.example.test/', fetchFn })).resolves.toEqual([
      {
        id: 'workspace-1',
        name: 'Rapport Core',
        inviteCode: 'CORE1234',
        role: 'owner',
        memberCount: 1,
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z'
      }
    ]);
  });

  it('creates and joins workspaces with the configured endpoints', async () => {
    const fetchFn = vi
      .fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith('/workspaces')) {
          expect(init?.headers).toEqual({
            Authorization: 'Bearer jwt.token',
            'Content-Type': 'application/json'
          });
          expect(init?.body).toBe(JSON.stringify({ name: 'Rapport Core' }));

          return createResponse({
            ok: true,
            workspace: {
              id: 'workspace-1',
              name: 'Rapport Core',
              inviteCode: 'CORE1234',
              role: 'owner',
              memberCount: 1,
              createdAt: '2026-05-21T00:00:00.000Z',
              updatedAt: '2026-05-21T00:00:00.000Z'
            }
          });
        }

        expect(String(input)).toBe('https://api.example.test/workspaces/join');
        expect(init?.body).toBe(JSON.stringify({ inviteCode: 'CORE1234' }));

        return createResponse({
          ok: true,
          workspace: {
            id: 'workspace-1',
            name: 'Rapport Core',
            inviteCode: 'CORE1234',
            role: 'member',
            memberCount: 2,
            createdAt: '2026-05-21T00:00:00.000Z',
            updatedAt: '2026-05-21T00:30:00.000Z'
          }
        });
      });

    await expect(createWorkspace({ name: 'Rapport Core' }, 'jwt.token', { apiBaseUrl: 'https://api.example.test', fetchFn })).resolves.toMatchObject({
      role: 'owner'
    });
    await expect(joinWorkspace({ inviteCode: 'CORE1234' }, 'jwt.token', { apiBaseUrl: 'https://api.example.test', fetchFn })).resolves.toMatchObject({
      role: 'member'
    });
  });

  it('throws API error messages for unsuccessful requests', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        {
          ok: false,
          error: 'Workspace invite code was not recognized.'
        },
        {
          ok: false,
          status: 404
        }
      )
    );

    await expect(joinWorkspace({ inviteCode: 'missing' }, 'jwt.token', { apiBaseUrl: '/api', fetchFn })).rejects.toEqual(
      new WorkspaceApiError('Workspace invite code was not recognized.', 404)
    );
  });

  it('falls back to generic messages for malformed success payloads and non-JSON errors', async () => {
    const incompleteListFetch = vi.fn(async () => createResponse({ ok: true }));
    const incompleteWorkspaceFetch = vi.fn(async () => createResponse({ ok: true }));
    const nonJsonErrorFetch = vi.fn(async () =>
      ({
        ok: false,
        status: 500,
        json: vi.fn(async () => {
          throw new Error('not json');
        })
      }) as unknown as Response
    );

    await expect(fetchWorkspaces('jwt.token', { apiBaseUrl: '/api', fetchFn: incompleteListFetch })).rejects.toEqual(
      new WorkspaceApiError('Workspace list response was incomplete.', 500)
    );
    await expect(createWorkspace({ name: 'Rapport Core' }, 'jwt.token', { apiBaseUrl: '/api', fetchFn: incompleteWorkspaceFetch })).rejects.toEqual(
      new WorkspaceApiError('Workspace response was incomplete.', 500)
    );
    await expect(fetchWorkspaces('jwt.token', { apiBaseUrl: '/api', fetchFn: nonJsonErrorFetch })).rejects.toEqual(
      new WorkspaceApiError('Workspace request failed.', 500)
    );
  });

  it('surfaces network failures with a consistent offline-style message and uses window.fetch by default', async () => {
    const networkFailureFetch = vi.fn(async () => {
      throw new Error('offline');
    });

    await expect(fetchWorkspaces('jwt.token', { apiBaseUrl: '/api', fetchFn: networkFailureFetch })).rejects.toEqual(
      new WorkspaceApiError('Unable to reach the workspace service.', 0)
    );

    const originalFetch = window.fetch;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('/api/workspaces');
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.default'
      });

      return createResponse({
        ok: true,
        workspaces: []
      });
    });

    window.fetch = fetchSpy as typeof window.fetch;

    try {
      await expect(fetchWorkspaces('jwt.default')).resolves.toEqual([]);
    } finally {
      window.fetch = originalFetch;
    }
  });
});

