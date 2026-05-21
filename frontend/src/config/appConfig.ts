type EnvLike = {
  VITE_API_BASE_URL?: string;
  VITE_SOCKET_URL?: string;
};

/**
 * Resolves the frontend runtime configuration from Vite environment values with
 * sensible local defaults.
 */
export function resolveAppConfig(envLike: EnvLike, locationOrigin: string) {
  return {
    apiBaseUrl: envLike.VITE_API_BASE_URL || '/api',
    socketUrl: envLike.VITE_SOCKET_URL || locationOrigin
  };
}

/**
 * Shared application config used by the running frontend.
 */
export const appConfig = resolveAppConfig(import.meta.env as EnvLike, window.location.origin);

