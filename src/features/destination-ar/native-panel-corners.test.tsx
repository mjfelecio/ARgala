import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ExhibitGalleryEntry } from './danao-stage';
import { ExhibitFrame } from './exhibit-frame';
import { NativePanelAction } from './information-tile';
import { destinationIds } from '@/features/destinations/catalog';
import { getExhibitStageProfile } from './exhibit-stage';
import { createPhotoIslandsProfile, exhibitGalleryEntries } from './photo-islands';
import content from './featured-presentation-content.json';
import type { ArNativeStyle } from './native-styles';

vi.mock('@reactvision/react-viro', () => ({ ViroNode: 'node', ViroQuad: 'quad', ViroImage: 'image', ViroText: 'text' }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => true }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('./holographic-assets', () => ({ holographicAssets: { frame: 101 } }));
const style: ArNativeStyle = { text: fontSize => ({ fontSize, fontFamily: 'test', fontWeight: '400', color: '#fff', textAlign: 'center', textAlignVertical: 'center' }) };
let tree: ReactTestRenderer;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });

// The actual frame texture is 512 square, painted 5..507 with rx=30 and
// a three-pixel stroke. Use its inner painted curve, not its rectangular quad.
function insidePaintedFrame(x: number, y: number, width: number, height: number) {
  const px = Math.abs(x) / width * 512; const py = Math.abs(y) / height * 512;
  const dx = Math.max(0, px - 221); const dy = Math.max(0, py - 221);
  return px <= 249.5 && py <= 249.5 && dx * dx + dy * dy <= 28.5 ** 2 + 1e-8;
}
it('contains every original photo corner within its rounded painted frame, including portrait originals', async () => {
  const originals: string[] = [];
  for (const id of destinationIds) {
    const profile = createPhotoIslandsProfile(getExhibitStageProfile(id)!);
    for (const entry of exhibitGalleryEntries(profile)) {
      await act(async () => { tree = create(<ExhibitGalleryEntry profile={profile} entry={entry} slot={{ id: entry.id, position: [0, 0, -2], rotation: [0, 65, 0], scale: 1, angle: 65 }} enabled style={style} onSelect={() => {}} />); });
      const photo = tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID?.includes('cover'))!;
      const frame = tree.root.findAllByType('image' as React.ElementType).find(node => node.props.testID === 'holographic-surface')!;
      const original = content.media.find(photo => photo.id === (entry.mediaId ?? profile.media[0].id))!;
      expect(insidePaintedFrame(photo.props.width / 2, photo.props.height / 2, frame.props.width, frame.props.height), original.id).toBe(true);
      expect(photo.props.height / photo.props.width).toBeCloseTo(original.height / original.width);
      expect(photo.props.height).toBeLessThanOrEqual(1.05);
      expect(photo.props).toMatchObject({ source: profile.media.find(photo => photo.id === original.id)!.source, resizeMode: 'ScaleToFit', highAccuracyEvents: true, ignoreEventHandling: false });
      originals.push(original.id);
      await act(async () => tree.unmount());
    }
  }
  expect(new Set(originals).size).toBe(54);
});
it('uses the painted native quad as the only action hit surface and retires disabled callbacks', async () => {
  const pressed = vi.fn();
  const view = (enabled: boolean, label = 'Next') => <NativePanelAction id="test" label={label} position={[0, 0, 0]} width={0.46} enabled={enabled} style={style} onPress={pressed} />;
  await act(async () => { tree = create(view(true)); });
  const paint = tree.root.findByType('quad' as React.ElementType);
  expect(paint.props).toMatchObject({ width: 0.46, height: 0.18, highAccuracyEvents: true, ignoreEventHandling: false, materials: 'argalaRingRoundedSurface' });
  expect(paint.props.onClick).toBeUndefined();
  expect(tree.root.findByType('text' as React.ElementType).props.ignoreEventHandling).toBe(true);
  await act(async () => tree.update(view(true, '次へ')));
  expect(tree.root.findByType('quad' as React.ElementType)).toBe(paint);
  const node = tree.root.findByType('node' as React.ElementType); const retained = node.props.onClick;
  await act(async () => retained()); expect(pressed).toHaveBeenCalledOnce();
  await act(async () => tree.update(view(false)));
  expect(paint.props.ignoreEventHandling).toBe(true); expect(node.props.ignoreEventHandling).toBe(true); expect(node.props.onClick).toBeUndefined();
  await act(async () => retained()); expect(pressed).toHaveBeenCalledOnce();
});

it('keeps reader decoration inside the rounded surface without a square backplate', async () => {
  await act(async () => { tree = create(<ExhibitFrame width={1.275} height={1.275} variant="reader" decorations />); });
  expect(tree.root.findAllByType('quad' as React.ElementType)).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: 'holographic-surface' })).toHaveLength(1);
});
