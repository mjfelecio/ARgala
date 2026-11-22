import type { ApprovedEffectName } from './system-audio';

type ArSystemAudioModule = {
  play(token: number, clip: ApprovedEffectName): Promise<void>;
  stop(token: number): Promise<void>;
};

let nextToken = 0;

/** Play a local one-shot owned by the current JS cue and Android audio focus. */
export function playApprovedArEffect(clip: ApprovedEffectName, onFinished: () => void): () => void {
  const token = ++nextToken;
  let current = true;
  let native: ArSystemAudioModule | null = null;

  void (async () => {
    try {
      const core = await import('expo-modules-core');
      if (!current) return;
      // Older clients can still open the exhibit without the optional player.
      native = core.requireOptionalNativeModule<ArSystemAudioModule>('ArSystemAudio');
      await native?.play(token, clip);
    } catch {
      // Missing native capabilities and playback failures stay silent.
    }
    if (current) onFinished();
  })();

  return () => {
    current = false;
    try { void native?.stop(token).catch(() => {}); } catch { /* Native owner already retired. */ }
  };
}
