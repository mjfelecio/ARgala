import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { HolographicFrame } from './holographic-frame';
const native = vi.hoisted(() => ({ prepareImage: vi.fn() }));
vi.mock('./holographic-assets', () => ({ holographicAssets: { frame: 101, reader: 109, toolbar: 110 } }));
vi.mock('@reactvision/react-viro', async () => {
  const R = await import('react');
  return { ViroNode: 'node', ViroQuad: 'quad', ViroImage: (props: Record<string, unknown>) => { native.prepareImage(props); return R.createElement('image', props); } };
});
let tree: ReactTestRenderer;
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it('prepares an unchanged native border once across parent page commits and still updates real surface changes', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); native.prepareImage.mockClear();
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  function View({ page, enabled = false }: { page: number; enabled?: boolean }) {
    return <><HolographicFrame width={1.275} height={1.275} variant="reader" decorations={false} interactiveSurface={enabled} /><label>{page}</label></>;
  }
  await act(async () => { tree = create(<View page={0} />); });
  const surface = tree.root.findByType('image' as React.ElementType);
  for (let page = 1; page < 5; page++) await act(async () => tree.update(<View page={page} />));
  expect(native.prepareImage).toHaveBeenCalledOnce();
  expect(tree.root.findByType('image' as React.ElementType)).toBe(surface);
  await act(async () => tree.update(<View page={5} enabled />));
  expect(native.prepareImage).toHaveBeenCalledTimes(2);
  expect(surface.props).toMatchObject({ ignoreEventHandling: false, highAccuracyEvents: true });
});
