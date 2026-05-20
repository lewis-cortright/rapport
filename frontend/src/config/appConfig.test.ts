import { describe, expect, it } from 'vitest';
import { resolveAppConfig } from './appConfig';

describe('resolveAppConfig', () => {
  it('uses configured environment values when they exist', () => {
    expect(
      resolveAppConfig(
        {
          VITE_API_BASE_URL: 'https://api.example.test',
          VITE_SOCKET_URL: 'https://socket.example.test'
        },
        'https://app.example.test'
      )
    ).toEqual({
      apiBaseUrl: 'https://api.example.test',
      socketUrl: 'https://socket.example.test'
    });
  });

  it('falls back to same-origin defaults when env values are empty', () => {
    expect(resolveAppConfig({}, 'https://app.example.test')).toEqual({
      apiBaseUrl: '/api',
      socketUrl: 'https://app.example.test'
    });
  });
});

