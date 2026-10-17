export class LocationTimeoutError extends Error {
  readonly code = 'timeout';
  constructor() { super('Location request timed out.'); this.name = 'LocationTimeoutError'; }
}

export function locationFailure(error: unknown): { error: string; errorCode: 'timeout' | null } {
  return { error: error instanceof Error ? error.message : 'Location unavailable.',
    errorCode: error instanceof LocationTimeoutError ? error.code : null };
}
