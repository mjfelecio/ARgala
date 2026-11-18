import type { Language } from '../../../supabase/functions/_shared/contracts';

export type AudioClip = { source: number; rightsReference: string; approvalReference: string; previewOnly?: true };
export type AudioCue = AudioClip & { channel: 'voice' | 'effect'; playbackId: number };
export type AudioEvent = 'initialized' | 'deployed' | 'focused' | 'trackingLost' | 'pageChanged' | 'closed' | 'modeSwitched';
export type AudioManifest = { voices: Record<Language, AudioClip | null>; effects: Record<Exclude<AudioEvent, 'initialized'>, AudioClip | null> };
export type AudioPreferences = { systemVoice: boolean; soundEffects: boolean };

/** Each recording requires rights and release review. Missing locale clips stay silent. */
export const approvedSystemAudio: AudioManifest = {
  voices: { en: null, ja: null, ko: null },
  effects: { deployed: null, focused: null, trackingLost: null, pageChanged: null, closed: null, modeSwitched: null },
};

export class ArSystemAudio {
  private consumed = new Set<string>();
  private sequence = 0;
  private cue: AudioCue | null = null;
  private listeners = new Set<() => void>();

  constructor(private manifest: AudioManifest, private readonly play: (clip: AudioClip) => void = () => {}, private allowPreview = false) {}

  getSnapshot = () => this.cue;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(cue: AudioCue | null) {
    this.cue = cue;
    this.listeners.forEach(listener => listener());
  }

  updateManifest(manifest: AudioManifest, allowPreview = false) {
    if (manifest === this.manifest && allowPreview === this.allowPreview) return;
    this.finish();
    this.manifest = manifest;
    this.allowPreview = allowPreview;
  }

  event(event: AudioEvent, id: string, language: Language, preferences: AudioPreferences, firstVisit: boolean) {
    const key = `${event}:${id}`;
    if (this.consumed.has(key)) return;
    this.consumed.add(key);

    const voice = event === 'initialized';
    const enabled = voice ? firstVisit && preferences.systemVoice : preferences.soundEffects;
    if (!enabled || this.cue && (!voice || this.cue.channel === 'voice')) return;

    const clip = voice ? this.manifest.voices[language] : this.manifest.effects[event];
    if (!clip || clip.previewOnly && !this.allowPreview || !Number.isSafeInteger(clip.source) || clip.source <= 0 || !clip.rightsReference.trim() || !clip.approvalReference.trim()) return;

    // Voice replaces any current effect. A keyed native player owns each cue,
    // and completion from the previous player cannot finish its replacement.
    this.publish({ ...clip, channel: voice ? 'voice' : 'effect', playbackId: ++this.sequence });
    this.play(clip);
  }

  finish(playbackId?: number) {
    if (this.cue && (playbackId === undefined || this.cue.playbackId === playbackId)) this.publish(null);
  }
}
