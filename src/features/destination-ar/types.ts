export type ArSupport = 'supported' | 'unsupported' | 'checking' | 'native-unavailable' | 'failed';
export type StartupError = 'native-unavailable' | 'unsupported' | 'checking' | 'failed' | 'permission-failed' | 'startup-timeout';
export type StartupPhase = 'idle' | 'checking' | 'permission' | 'prepared' | 'initializing' | 'live' | 'interrupted' | 'failed';
export type TrackingState = 'normal' | 'limited' | 'unavailable';
export type Vector3 = [number, number, number];
export type PoseSample = { position: Vector3; forward: Vector3 };
