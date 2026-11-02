"""Produce original UI tones and review-only system speech. No runtime TTS.
Use --espeak-root with an extracted espeak-ng installation for voice drafts.
"""
from pathlib import Path
import argparse
import array
import json
import math
import os
import subprocess
import tempfile
import wave

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--espeak-root', type=Path)
args = parser.parse_args()
out = root / 'assets/development/ar-audio'
out.mkdir(exist_ok=True)
rate = 22050
# Original analytic oscillators; no sampled music, voice or external recording.
effects = {'deployed': (.42, 280, 680, .42), 'focused': (.10, 620, 680, .30), 'pageChanged': (.065, 470, 500, .22), 'closed': (.12, 520, 320, .28), 'trackingLost': (.16, 270, 210, .20)}
for name, (duration, start, end, level) in effects.items():
    frames = array.array('h')
    for index in range(int(rate * duration)):
        t = index / rate; progress = t / duration
        envelope = math.sin(math.pi * progress) ** 1.5
        phase = 2 * math.pi * (start * t + .5 * (end - start) * t * progress)
        value = level * envelope * (math.sin(phase) + .12 * math.sin(phase * 1.5)) / 1.12
        frames.append(round(value * 32767))
    with wave.open(str(out / f'{name}.wav'), 'wb') as sound:
        sound.setparams((1, 2, rate, len(frames), 'NONE', 'not compressed')); sound.writeframes(frames.tobytes())

if args.espeak_root:
    tool = args.espeak_root / 'usr/bin/espeak-ng'
    data = args.espeak_root / 'usr/lib/x86_64-linux-gnu'
    environment = {**os.environ, 'LD_LIBRARY_PATH': str(data)}
    # Pronunciation aliases expand AR into native letter names. They express
    # the same draft system script; all recordings still need human review.
    spoken = {'en': ('en-us', 'A. R. initialized.'), 'ja': ('ja', 'エーアールをきどうしました。'), 'ko': ('ko', '에이알이 시작되었습니다.')}
    with tempfile.TemporaryDirectory(prefix='argala-voice-') as temporary:
        for language, (voice, script) in spoken.items():
            source = Path(temporary) / f'{language}.wav'
            subprocess.run([str(tool), f'--path={data}', '-v', voice, '-s', '185', '-p', '40', '-w', str(source), script], env=environment, check=True)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(source), '-af', 'highpass=f=180,lowpass=f=5000', '-ar', str(rate), '-ac', '1', '-c:a', 'pcm_s16le', str(out / f'startup-{language}.wav')], check=True)

# Short UI speech is below EBU loudness-window lengths. Use deterministic peak
# normalization rather than a long-program loudness estimator that mutes clips.
for path in out.glob('startup-*.wav'):
    with wave.open(str(path)) as sound:
        parameters = sound.getparams(); samples = array.array('h', sound.readframes(sound.getnframes()))
    peak = max(abs(value) for value in samples)
    assert peak > 512 and sum(abs(value) > 100 for value in samples) / len(samples) > .15, 'Speech must contain audible signal'
    normalized = array.array('h', (round(value * .75 * 32767 / peak) for value in samples))
    with wave.open(str(path), 'wb') as sound:
        sound.setparams(parameters); sound.writeframes(normalized.tobytes())

inventory = {}
for path in sorted(out.glob('*.wav')):
    with wave.open(str(path)) as sound:
        assert sound.getnchannels() == 1 and sound.getsampwidth() == 2 and sound.getframerate() == rate
        samples = array.array('h', sound.readframes(sound.getnframes()))
        duration = len(samples) / rate; peak = max(abs(value) for value in samples)
        assert 0 < duration < 2.5 and 0 < peak < 32767, f'Invalid/clipped cue: {path.name}'
        inventory[path.name] = {'durationSeconds': round(duration, 3), 'sampleRate': rate, 'peakDbfs': round(20 * math.log10(peak / 32767), 2)}
(out / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n')
print(json.dumps(inventory, indent=2))
