import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArSystemAudio, approvedSystemAudio, type AudioCue, type AudioEvent, type AudioPreferences, type AudioManifest } from './system-audio';
import { isViroSpikeEnabled } from './dev-guard';
import type { Language } from '../../../supabase/functions/_shared/contracts';

function channelEnabled(cue: AudioCue, preferences: AudioPreferences | undefined) {
  return cue.channel === 'voice' ? preferences?.systemVoice : preferences?.soundEffects;
}

export function useArSystemAudio(
  language: Language,
  preferences: AudioPreferences | undefined,
  running: boolean,
  previewManifest?: AudioManifest,
  claimStartupVoice?: () => boolean,
) {
  const audition = previewManifest && isViroSpikeEnabled() ? previewManifest : undefined;
  const manifest = audition ?? approvedSystemAudio;
  const [audio] = useState(() => new ArSystemAudio(manifest, undefined, !!audition));
  const cue = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  const scope = useMemo(() => ({ language, running }), [language, running]);
  const liveScope = useRef<typeof scope | null>(null);
  const settings = useRef({ preferences, claimStartupVoice });

  useLayoutEffect(() => {
    liveScope.current = scope;
    return () => {
      liveScope.current = null;
      audio.finish();
    };
  }, [audio, scope]);
  useLayoutEffect(() => {
    audio.updateManifest(manifest, !!audition);
    settings.current = { preferences, claimStartupVoice };
    const playing = audio.getSnapshot();
    if (playing && !channelEnabled(playing, preferences)) audio.finish(playing.playbackId);
  }, [audio, manifest, audition, preferences, claimStartupVoice]);

  const event = useCallback((kind: AudioEvent, id: string, firstVisit = false) => {
    if (!scope.running || liveScope.current !== scope) return;
    const current = settings.current;
    if (!current.preferences) return;
    const startupVoice = kind === 'initialized' && firstVisit && (current.claimStartupVoice?.() ?? true);
    audio.event(kind, id, scope.language, current.preferences, startupVoice);
  }, [audio, scope]);
  const playbackId = cue?.playbackId;
  const finish = useCallback(() => { if (playbackId !== undefined) audio.finish(playbackId); }, [audio, playbackId]);

  return { cue: running && cue && channelEnabled(cue, preferences) ? cue : null, event, finish };
}
