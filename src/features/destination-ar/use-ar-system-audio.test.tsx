import { useLayoutEffect, type ComponentProps } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { approvedSystemAudio, type AudioManifest, type AudioPreferences } from './system-audio';
import { useArSystemAudio } from './use-ar-system-audio';

const preferences = { systemVoice: true, soundEffects: true };
const clip = { source: 1, rightsReference: 'Test rights', approvalReference: 'Test review' };
const manifest: AudioManifest = {
  voices: { en: clip, ja: null, ko: null },
  effects: { ...approvedSystemAudio.effects, deployed: clip, modeSwitched: clip },
};
let tree: ReactTestRenderer | undefined;
let audio: ReturnType<typeof useArSystemAudio>;

function Probe({ running, settings = preferences, claimStartupVoice }: {
  running: boolean;
  settings?: AudioPreferences;
  claimStartupVoice?: () => boolean;
}) {
  const value = useArSystemAudio('en', settings, running, manifest, claimStartupVoice);
  useLayoutEffect(() => { audio = value; }, [value]);
  return null;
}

const update = async (props: ComponentProps<typeof Probe>) => {
  await act(async () => {
    if (tree) tree.update(<Probe {...props} />);
    else tree = create(<Probe {...props} />);
  });
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('__DEV__', true);
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', '1');
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  tree = undefined;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('cancels interrupted speech and rejects callbacks from its previous running frame', async () => {
  await update({ running: true });
  const retired = audio.event;
  await act(async () => retired('initialized', 'entry', true));
  expect(audio.cue?.channel).toBe('voice');
  await update({ running: false });
  expect(audio.cue).toBeNull();

  await update({ running: true });
  await act(async () => retired('deployed', 'stale'));
  expect(audio.cue).toBeNull();
  await act(async () => audio.event('initialized', 'entry', true));
  expect(audio.cue).toBeNull();
  await act(async () => audio.event('deployed', 'current'));
  expect(audio.cue?.channel).toBe('effect');
});

it('uses current preferences when a still-active frame sends an event', async () => {
  await update({ running: true });
  const event = audio.event;
  await update({ running: true, settings: { ...preferences, soundEffects: false } });
  await act(async () => event('deployed', 'entry'));
  expect(audio.cue).toBeNull();
});

it('honors the surviving session’s startup claim after the native audio owner remounts', async () => {
  let attempted = false;
  const claimStartupVoice = () => {
    if (attempted) return false;
    attempted = true;
    return true;
  };
  await update({ running: true, claimStartupVoice });
  await act(async () => audio.event('initialized', 'entry', true));
  expect(audio.cue?.channel).toBe('voice');

  await act(async () => tree?.unmount());
  tree = undefined;
  await update({ running: true, claimStartupVoice });
  await act(async () => audio.event('initialized', 'entry', true));
  expect(audio.cue).toBeNull();
});

it.each([[false, '1'], [true, '']] as const)('keeps an audition silent when either development guard is missing (%s/%s)', async (development, flag) => {
  vi.stubGlobal('__DEV__', development);
  vi.stubEnv('EXPO_PUBLIC_VIRO_SPIKE', flag);
  await update({ running: true });
  await act(async () => audio.event('initialized', 'entry', true));
  expect(audio.cue).toBeNull();
});
