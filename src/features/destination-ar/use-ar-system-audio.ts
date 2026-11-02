import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { ArSystemAudio, approvedSystemAudio, type AudioEvent, type AudioPreferences, type AudioManifest } from './system-audio';
import { isViroSpikeEnabled } from './dev-guard';
import type { Language } from '../../../supabase/functions/_shared/contracts';
export function useArSystemAudio(language: Language, preferences: AudioPreferences | undefined, running: boolean, previewManifest?: AudioManifest) {
  const [audio] = useState(() => new ArSystemAudio(previewManifest ?? approvedSystemAudio, undefined, !!previewManifest && isViroSpikeEnabled()));
  useLayoutEffect(() => { audio.updateManifest(previewManifest ?? approvedSystemAudio, !!previewManifest && isViroSpikeEnabled()); }, [audio, previewManifest]);
  const cue = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  useEffect(() => { audio.finish(); }, [audio, language]);
  useEffect(() => { if (!running) { audio.finish(); } }, [audio, running]);
  useEffect(() => { if (cue && !(cue.channel === 'voice' ? preferences?.systemVoice : preferences?.soundEffects)) audio.finish(); }, [audio, cue, preferences?.systemVoice, preferences?.soundEffects]);
  const event = useCallback((kind: AudioEvent, id: string, firstVisit = false) => {
    if (running && preferences) audio.event(kind, id, language, preferences, firstVisit);
  }, [audio, language, preferences, running]);
  const finish = useCallback(() => { if (cue) audio.finish(cue.playbackId); }, [audio, cue]);
  return { cue: running ? cue : null, event, finish };
}
