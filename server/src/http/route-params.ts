/**
 * Normalizes an Express route param into a single string value.
 * Express provides string values at runtime for these routes, but some type
 * surfaces widen params to string arrays, so the HTTP layer narrows them here
 * once instead of scattering casts throughout controllers.
 */
export function getSingleRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

