type EnvLike = {
  VITE_API_BASE_URL?: string;
  VITE_SOCKET_URL?: string;
};

export function resolveAppConfig(envLike: EnvLike, locationOrigin: string) {
  return {
    apiBaseUrl: envLike.VITE_API_BASE_URL || '/api',
    socketUrl: envLike.VITE_SOCKET_URL || locationOrigin
  };
}

export const appConfig = resolveAppConfig(import.meta.env as EnvLike, window.location.origin);

