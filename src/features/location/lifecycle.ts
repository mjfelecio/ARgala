/** Handles async native setup finishing after blur/unmount. Cleanup is idempotent. */
export function manageSubscription(start: () => Promise<{ remove(): void }>, onError: (error: unknown) => void): () => void {
  let stopped = false;
  let subscription: { remove(): void } | undefined;
  void start().then((value) => {
    if (stopped) value.remove();
    else subscription = value;
  }).catch((error: unknown) => { if (!stopped) onError(error); });
  return () => {
    if (stopped) return;
    stopped = true; subscription?.remove(); subscription = undefined;
  };
}
