import type { AudioClip, AudioManifest } from './system-audio';
const sample = (source: number): AudioClip => ({ source, previewOnly: true,
  rightsReference: 'assets/development/ar-audio/README.md',
  approvalReference: 'Owner requested development audition, 2026-11-02; voice/language/release review pending',
});
export const developmentSystemAudio: AudioManifest = {
  voices: { en: sample(require('../../../assets/development/ar-audio/startup-en.wav')), ja: sample(require('../../../assets/development/ar-audio/startup-ja.wav')), ko: sample(require('../../../assets/development/ar-audio/startup-ko.wav')) },
  effects: {
    deployed: sample(require('../../../assets/development/ar-audio/deployed.wav')),
    focused: sample(require('../../../assets/development/ar-audio/focused.wav')),
    pageChanged: sample(require('../../../assets/development/ar-audio/pageChanged.wav')),
    closed: sample(require('../../../assets/development/ar-audio/closed.wav')),
    trackingLost: sample(require('../../../assets/development/ar-audio/trackingLost.wav')),
  },
};
