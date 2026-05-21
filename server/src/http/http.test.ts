import { describe, expect, it } from 'vitest';
import { getAuthenticatedUser } from './authentication.js';
import { getSingleRouteParam } from './route-params.js';

describe('http helpers', () => {
  describe('getAuthenticatedUser', () => {
    it('returns the authenticated user from response locals', () => {
      const response = {
        locals: {
          authUser: {
            id: 'user-1',
            username: 'rapport-builder',
            email: 'builder@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        }
      } as any;

      expect(getAuthenticatedUser(response)).toEqual({
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      });
    });

    it('throws when the authenticated user was not attached', () => {
      const response = {
        locals: {}
      } as any;

      expect(() => getAuthenticatedUser(response)).toThrow('Authenticated user was not attached to the request context.');
    });
  });

  describe('getSingleRouteParam', () => {
    it('returns a direct string param unchanged', () => {
      expect(getSingleRouteParam('workspace-1')).toBe('workspace-1');
    });

    it('returns the first value when express widens a param to an array', () => {
      expect(getSingleRouteParam(['workspace-1', 'workspace-2'])).toBe('workspace-1');
    });

    it('falls back to an empty string when the param is missing', () => {
      expect(getSingleRouteParam(undefined)).toBe('');
    });
  });
});

