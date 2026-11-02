import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ArSystemAudio, approvedSystemAudio, type AudioEvent, type AudioPreferences } from './system-audio';
import type { Language } from '../../../supabase/functions/_shared/contracts';
export function useArSystemAudio(language: Language, preferences: AudioPreferences | undefined, running: boolean) {
  const [audio] = useState(() => new ArSystemAudio(approvedSystemAudio));
  const cue = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  useEffect(() => { if (!running) { audio.finish(); } }, [audio, running]);
  useEffect(() => { if (cue && !(cue.channel === 'voice' ? preferences?.systemVoice : preferences?.soundEffects)) audio.finish(); }, [audio, cue, preferences?.systemVoice, preferences?.soundEffects]);
  const event = useCallback((kind: AudioEvent, id: string, firstVisit = false) => {
    if (running && preferences) audio.event(kind, id, language, preferences, firstVisit);
  }, [audio, language, preferences, running]);
  const finish = useCallback(() => { audio.finish(); }, [audio]);
  return { cue: running ? cue : null, event, finish };
}
