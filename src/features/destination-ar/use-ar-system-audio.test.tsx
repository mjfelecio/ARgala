import { useLayoutEffect, type ComponentProps } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { approvedSystemAudio, type AudioManifest, type AudioPreferences } from './system-audio';
import { useArSystemAudio } from './use-ar-system-audio';

const nativeModule = vi.hoisted(() => ({
  exists: true,
  play: vi.fn<(token: number, cue: string) => Promise<void>>(),
  stop: vi.fn<(token: number) => Promise<void>>(),
}));
vi.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: (name: string) => nativeModule.exists && name === 'ArSystemAudio' ? nativeModule : null,
}));

const preferences = { systemVoice: true, soundEffects: true };
const clip = { source: 1, rightsReference: 'Test rights', approvalReference: 'Test review' };
const manifest: AudioManifest = {
  voices: { en: clip, ja: null, ko: null },
  effects: { ...approvedSystemAudio.effects, deployed: clip, modeSwitched: clip },
};
let tree: ReactTestRenderer | undefined;
let audio: ReturnType<typeof useArSystemAudio>;

function Probe({ running, settings = preferences, claimStartupVoice, preview = true }: {
  running: boolean;
  settings?: AudioPreferences;
  claimStartupVoice?: () => boolean;
  preview?: boolean;
}) {
  const value = useArSystemAudio('en', settings, running, preview ? manifest : undefined, claimStartupVoice);
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
  nativeModule.exists = true;
  nativeModule.play.mockReset().mockImplementation(() => new Promise(() => {}));
  nativeModule.stop.mockReset().mockResolvedValue(undefined);
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

it('cancels an approved Android effect on interruption and ignores a retired native completion', async () => {
  const retired = Promise.withResolvers<void>();
  nativeModule.play.mockReturnValueOnce(retired.promise);
  await update({ running: true, preview: false });
  await act(async () => { audio.event('deployed', 'entry'); });
  await act(async () => vi.dynamicImportSettled());
  const [firstToken] = nativeModule.play.mock.calls[0];
  expect(nativeModule.play).toHaveBeenCalledExactlyOnceWith(firstToken, 'reveal');
  await update({ running: true, preview: false, settings: { ...preferences, systemVoice: false } });
  expect(nativeModule.play).toHaveBeenCalledOnce();
  expect(nativeModule.stop).not.toHaveBeenCalled();

  await update({ running: false, preview: false });
  expect(nativeModule.stop).toHaveBeenCalledExactlyOnceWith(firstToken);
  await update({ running: true, preview: false });
  expect(nativeModule.play).toHaveBeenCalledOnce();
  await act(async () => audio.event('modeSwitched', 'current'));
  await act(async () => vi.dynamicImportSettled());
  const [nextToken] = nativeModule.play.mock.calls[1];
  expect(nextToken).not.toBe(firstToken);
  expect(nativeModule.play).toHaveBeenLastCalledWith(nextToken, 'view_switch');

  await act(async () => retired.resolve());
  expect(audio.cue?.source).toBe('view_switch');
  await update({ running: true, preview: false, settings: { ...preferences, soundEffects: false } });
  expect(nativeModule.stop).toHaveBeenLastCalledWith(nextToken);
  expect(audio.cue).toBeNull();
});

it('drops a denied or unavailable approved cue without blocking a later interaction', async () => {
  nativeModule.exists = false;
  await update({ running: true, preview: false });
  await act(async () => audio.event('deployed', 'entry'));
  await act(async () => vi.dynamicImportSettled());
  expect(nativeModule.play).not.toHaveBeenCalled();
  expect(audio.cue).toBeNull();

  nativeModule.exists = true;
  nativeModule.play.mockRejectedValueOnce(new Error('Android audio focus denied'));
  await act(async () => audio.event('focused', 'denied'));
  await act(async () => vi.dynamicImportSettled());
  expect(nativeModule.play).toHaveBeenCalledOnce();
  expect(audio.cue).toBeNull();
  await act(async () => audio.event('focused', 'denied'));
  expect(nativeModule.play).toHaveBeenCalledOnce();
  await act(async () => audio.event('closed', 'accepted'));
  await act(async () => vi.dynamicImportSettled());
  expect(nativeModule.play).toHaveBeenLastCalledWith(expect.any(Number), 'panel_close');
});
