import { expect, it, vi } from 'vitest';
import { ArSystemAudio, type AudioManifest } from './system-audio';
const clip = (source: number) => ({ source, rightsReference: 'Synthetic test rights', approvalReference: 'Synthetic test review' });
const manifest: AudioManifest = { voices: { en: clip(1), ja: clip(2), ko: clip(3) }, effects: { deployed: clip(4), focused: clip(5), trackingLost: clip(6) } };
it.each([true, false].flatMap(systemVoice => [true, false].map(soundEffects => ({ systemVoice, soundEffects }))))('independently gates $systemVoice voice and $soundEffects effects with no overlapping playback', preferences => {
  const play = vi.fn(); const audio = new ArSystemAudio(manifest, play);
  audio.event('initialized', 'first', 'ja', preferences, true);
  expect(play.mock.calls.map(call => call[0].source)).toEqual(preferences.systemVoice ? [2] : []);
  audio.finish(); audio.event('deployed', 'deployment', 'ja', preferences, true);
  expect(play.mock.calls.map(call => call[0].source)).toEqual([...(preferences.systemVoice ? [2] : []), ...(preferences.soundEffects ? [4] : [])]);
  audio.event('focused', 'focus', 'ja', preferences, true); expect(play).toHaveBeenCalledTimes(Number(preferences.systemVoice) + Number(preferences.soundEffects));
});
it('never speaks on repeat, recovery, duplicate events or missing reviewed locale assets', () => {
  const play = vi.fn(); const audio = new ArSystemAudio({ ...manifest, voices: { en: clip(1), ja: null, ko: null } }, play);
  audio.event('initialized', 'first', 'ja', { systemVoice: true, soundEffects: true }, true);
  audio.event('initialized', 'first', 'en', { systemVoice: true, soundEffects: true }, true);
  audio.event('initialized', 'repeat', 'en', { systemVoice: true, soundEffects: true }, false);
  expect(play).not.toHaveBeenCalled();
});
it('requires reviewed rights and stops ownership without queuing interrupted cues', () => {
  const play = vi.fn(); const audio = new ArSystemAudio({ ...manifest, voices: { en: { ...clip(1), approvalReference: '' }, ja: null, ko: null } }, play);
  audio.event('initialized', 'first', 'en', { systemVoice: true, soundEffects: true }, true); expect(play).not.toHaveBeenCalled();
  audio.event('deployed', 'deploy', 'ko', { systemVoice: true, soundEffects: true }, true); audio.finish();
  audio.event('deployed', 'deploy', 'ko', { systemVoice: true, soundEffects: true }, true); expect(play).toHaveBeenCalledOnce();
});
