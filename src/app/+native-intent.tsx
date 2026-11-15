// The browser owns OAuth callback URLs. Do not let Router turn them into a
// screen or retain authorization codes in navigation state.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path);
    if (url.protocol === 'argala:' && url.hostname === 'auth-callback') return '/sign-in';
  } catch { /* Preserve other router paths. */ }
  return path;
}
