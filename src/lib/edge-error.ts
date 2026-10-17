export class EdgeRequestError extends Error {
  constructor(public readonly code: string) { super('Edge request failed.'); this.name = 'EdgeRequestError'; }
}

export function edgeErrorMessageKey(error: unknown) {
  if (!(error instanceof EdgeRequestError)) return 'service.failed';
  switch (error.code) {
    case 'RATE_LIMITED': return 'service.rateLimited';
    case 'UNAUTHORIZED': return 'service.unauthorized';
    case 'ROUTE_UNAVAILABLE': return 'service.routeUnavailable';
    case 'UPSTREAM_ERROR':
    case 'UPSTREAM_UNAVAILABLE':
    case 'UPSTREAM_INVALID':
    case 'SERVICE_NOT_CONFIGURED':
    case 'LIMITER_UNAVAILABLE':
    case 'SERVICE_UNAVAILABLE': return 'service.unavailable';
    default: return 'service.failed';
  }
}
