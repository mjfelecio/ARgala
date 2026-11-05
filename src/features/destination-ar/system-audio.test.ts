import { expect, it, vi } from 'vitest';
import { ArSystemAudio, type AudioManifest } from './system-audio';
const clip = (source: number) => ({ source, rightsReference: 'Synthetic test rights', approvalReference: 'Synthetic test review' });
const manifest: AudioManifest = { voices: { en: clip(1), ja: clip(2), ko: clip(3) }, effects: { deployed: clip(4), focused: clip(5), trackingLost: clip(6), pageChanged: clip(7), closed: clip(8) } };
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
it('refuses audition clips without explicit development playback ownership', () => {
  const play = vi.fn();
  const preview = { ...manifest, voices: { ...manifest.voices, en: { ...clip(1), previewOnly: true as const } } };
  const audio = new ArSystemAudio(preview, play);
  audio.event('initialized', 'entry', 'en', { systemVoice: true, soundEffects: true }, true);
  expect(play).not.toHaveBeenCalled();
  const audition = new ArSystemAudio(preview, play, true);
  audition.event('initialized', 'entry', 'en', { systemVoice: true, soundEffects: true }, true);
  expect(play).toHaveBeenCalledOnce();
});
it('gives repeated sounds distinct playback ownership and ignores a retired native finish', () => {
  const audio = new ArSystemAudio(manifest);
  audio.event('focused', 'one', 'en', { systemVoice: true, soundEffects: true }, true);
  const first = audio.getSnapshot()!; audio.finish(first.playbackId);
  audio.event('focused', 'two', 'en', { systemVoice: true, soundEffects: true }, true);
  const second = audio.getSnapshot()!;
  expect(second.source).toBe(first.source); expect(second.playbackId).not.toBe(first.playbackId);
  audio.finish(first.playbackId); expect(audio.getSnapshot()).toBe(second);
  audio.finish(second.playbackId); expect(audio.getSnapshot()).toBeNull();
});
it('accepts late optional assets for future events without replaying a consumed startup announcement', () => {
  const audio = new ArSystemAudio({ ...manifest, voices: { en: null, ja: null, ko: null }, effects: { ...manifest.effects, focused: null } });
  audio.event('initialized', 'entry', 'en', { systemVoice: true, soundEffects: true }, true);
  audio.updateManifest(manifest);
  audio.event('initialized', 'entry', 'en', { systemVoice: true, soundEffects: true }, true);
  expect(audio.getSnapshot()).toBeNull();
  audio.event('focused', 'later', 'en', { systemVoice: true, soundEffects: true }, true);
  expect(audio.getSnapshot()?.source).toBe(5);
});
