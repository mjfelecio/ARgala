import type { Language } from '../../../supabase/functions/_shared/contracts';
export type AudioClip = { source: number; rightsReference: string; approvalReference: string; previewOnly?: true };
export type AudioCue = AudioClip & { channel: 'voice' | 'effect'; playbackId: number };
export type AudioEvent = 'initialized' | 'deployed' | 'focused' | 'trackingLost' | 'pageChanged' | 'closed';
export type AudioManifest = { voices: Record<Language, AudioClip | null>; effects: Record<Exclude<AudioEvent, 'initialized'>, AudioClip | null> };
export type AudioPreferences = { systemVoice: boolean; soundEffects: boolean };
/** No reviewed recordings have been supplied. Missing clips stay silent,
 * including missing JA/KO; English audio is never an implicit fallback.
 */
export const approvedSystemAudio: AudioManifest = { voices: { en: null, ja: null, ko: null }, effects: { deployed: null, focused: null, trackingLost: null, pageChanged: null, closed: null } };
export class ArSystemAudio {
  private consumed = new Set<string>();
  private playing = false;
  private sequence = 0;
  private cue: AudioCue | null = null;
  private listeners = new Set<() => void>();
  getSnapshot = () => this.cue;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(cue: AudioCue | null) { this.cue = cue; this.listeners.forEach(listener => listener()); }
  constructor(private manifest: AudioManifest, private readonly play: (clip: AudioClip) => void = () => {}, private allowPreview = false) {}
  updateManifest(manifest: AudioManifest, allowPreview = false) {
    if (manifest === this.manifest && allowPreview === this.allowPreview) return;
    this.finish(); this.manifest = manifest; this.allowPreview = allowPreview;
  }
  event(event: AudioEvent, id: string, language: Language, preferences: AudioPreferences, firstVisit: boolean) {
    const key = `${event}:${id}`;
    if (this.consumed.has(key)) return;
    this.consumed.add(key);
    const voice = event === 'initialized';
    if (this.playing || voice && (!firstVisit || !preferences.systemVoice) || !voice && !preferences.soundEffects) return;
    const clip = voice ? this.manifest.voices[language] : this.manifest.effects[event];
    if (!clip || clip.previewOnly && !this.allowPreview || !Number.isSafeInteger(clip.source) || clip.source <= 0 || !clip.rightsReference.trim() || !clip.approvalReference.trim()) return;
    this.playing = true; this.publish({ ...clip, channel: voice ? 'voice' : 'effect', playbackId: ++this.sequence }); this.play(clip);
  }
  finish(playbackId?: number) {
    if (playbackId !== undefined && this.cue?.playbackId !== playbackId) return;
    this.playing = false; if (this.cue) this.publish(null);
  }
}
