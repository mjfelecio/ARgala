import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { ArSystemAudio, approvedSystemAudio, type AudioManifest } from './system-audio';
const clip = (source: number) => ({ source, rightsReference: 'Synthetic test rights', approvalReference: 'Synthetic test review' });
const manifest: AudioManifest = { voices: { en: clip(1), ja: clip(2), ko: clip(3) }, effects: { deployed: clip(4), focused: clip(5), trackingLost: clip(6), pageChanged: clip(7), closed: clip(8), modeSwitched: clip(9) } };
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

it('lets first-visit speech replace an effect and drops effects issued during speech', () => {
  const audio = new ArSystemAudio(manifest);
  const preferences = { systemVoice: true, soundEffects: true };

  audio.event('deployed', 'deployment', 'en', preferences, true);
  const retired = audio.getSnapshot()!;
  audio.event('initialized', 'entry', 'en', preferences, true);
  const voice = audio.getSnapshot()!;
  expect(voice).toMatchObject({ channel: 'voice', source: 1 });
  audio.finish(retired.playbackId);
  expect(audio.getSnapshot()).toBe(voice);

  audio.event('modeSwitched', 'mode-1', 'en', preferences, false);
  expect(audio.getSnapshot()).toBe(voice);
  audio.finish(voice.playbackId);
  audio.event('modeSwitched', 'mode-1', 'en', preferences, false);
  expect(audio.getSnapshot()).toBeNull();
  audio.event('modeSwitched', 'mode-2', 'en', preferences, false);
  expect(audio.getSnapshot()).toMatchObject({ channel: 'effect', source: 9 });
});

const approvedEffects = [
  ['deployed', 'reveal', 'e99c4e6b3a37947ed8c95b8e5b6e339782d4309946be1e698e04871baf5b339d'],
  ['focused', 'panel_open', '053005880b146babed3d938f644cea87cc129e2e27b8fd50ebe07d1f799eb804'],
  ['pageChanged', 'page_turn', '5926114a68e2c2117ab51fa1f05f068e590ce7cc4ac8614542d7f2f05dd6bd24'],
  ['closed', 'panel_close', '13a8f22aa18efa2b7a724068b754a646adc4c8ac07dbc3fd784ed0015ab94d18'],
  ['modeSwitched', 'view_switch', 'd9703f3bcd8e549152ac5d5dd3ff6d8748ea744ee61450de0ae8b8edc1bf7be1'],
] as const;

it('packages exactly the five reviewed effect WAVs byte-for-byte', () => {
  const raw = new URL('../../../modules/ar-system-audio/android/src/main/res/raw/', import.meta.url);
  expect(readdirSync(raw).sort()).toEqual(approvedEffects.map(([, cue]) => `${cue}.wav`).sort());
  for (const [event, cue, expectedHash] of approvedEffects) {
    const wav = readFileSync(new URL(`${cue}.wav`, raw));
    expect(createHash('sha256').update(wav).digest('hex')).toBe(expectedHash);
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(48000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(approvedSystemAudio.effects[event]?.source).toBe(cue);
  }
  expect(approvedSystemAudio.effects.trackingLost).toBeNull();
});

it('keeps the three owner-approved scripts as reference with no in-app voice assets', () => {
  const reference = new URL('../../../docs/content/final-handoff-2026-11-19/audio/voice-scripts.json', import.meta.url);
  const bytes = readFileSync(reference);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('80bd032dc7408995a26276ba0d5eccc2cadf13100a78d0f4c1f5d649e38daa67');
  const handoff = JSON.parse(bytes.toString('utf-8'));
  expect(handoff.scripts.map((item: { locale: string }) => item.locale)).toEqual(['en', 'ja', 'ko']);
  expect(handoff.assetsProduced).toEqual([]);
  expect(approvedSystemAudio.voices).toEqual({ en: null, ja: null, ko: null });
});

it.each([true, false].flatMap(systemVoice => [true, false].map(soundEffects => ({ systemVoice, soundEffects }))))(
  'uses only approved cues with Voice=$systemVoice and Effects=$soundEffects', preferences => {
    const play = vi.fn();
    const audio = new ArSystemAudio(approvedSystemAudio, play);
    for (const locale of ['en', 'ja', 'ko'] as const) {
      audio.event('initialized', locale, locale, preferences, true);
      expect(audio.getSnapshot()).toBeNull();
    }
    for (const [event] of approvedEffects) {
      audio.event(event, event, 'en', preferences, false);
      audio.finish();
    }
    expect(play.mock.calls.map(([clip]) => clip.source)).toEqual(preferences.soundEffects ? approvedEffects.map(([, cue]) => cue) : []);
  },
);
