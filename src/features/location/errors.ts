export type LocationErrorCode = 'timeout' | 'invalid-position' | 'updates-unavailable';

export class LocationError extends Error {
  constructor(public readonly code: LocationErrorCode, message = 'Location request failed.') { super(message); this.name = 'LocationError'; }
}

export class LocationTimeoutError extends LocationError {
  constructor() { super('timeout', 'Location request timed out.'); this.name = 'LocationTimeoutError'; }
}

export function locationFailure(error: unknown, fallbackCode: LocationErrorCode | null = null): { error: string; errorCode: LocationErrorCode | null } {
  return { error: error instanceof Error ? error.message : typeof error === 'string' ? error : 'Location unavailable.',
    errorCode: error instanceof LocationError ? error.code : fallbackCode };
}

export function locationErrorMessageKey(code: unknown) {
  switch (code) {
    case 'timeout': return 'location.timeout';
    case 'invalid-position': return 'location.invalidPosition';
    case 'updates-unavailable': return 'location.updatesUnavailable';
    default: return 'location.unavailable';
  }
}
