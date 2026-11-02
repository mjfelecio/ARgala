import '@/test/native-ui';
import { readFileSync } from 'node:fs';
import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BrandLogo } from './brand-logo';
import { brandGeometry } from './brand-geometry';
import { JourneyMotif } from './journey-motif';

let tree: ReactTestRenderer;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args);
  });
});
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });

it.each(['primary', 'horizontal', 'mark'] as const)('preserves proportional %s geometry with one accessible brand label', async variant => {
  await act(async () => { tree = create(<BrandLogo variant={variant} width={64} />); });
  const svg = tree.root.findByType('svg' as React.ElementType);
  expect(svg.props).toMatchObject({ width: 64, accessible: true, accessibilityLabel: 'ARgala', pointerEvents: 'none', preserveAspectRatio: 'xMidYMid meet' });
  const [, , width, height] = svg.props.viewBox.split(' ').map(Number);
  expect(svg.props.height).toBe(64 * height / width);
  expect(tree.root.findAllByType('path' as React.ElementType)).toHaveLength(variant === 'mark' ? 2 : 8);
  expect(tree.root.findAllByType('path' as React.ElementType).slice(0, 2).map(path => path.props.fill)).toEqual(['#42D5A5', '#174D38']);
  expect(tree.root.findAllByType('text')).toHaveLength(0);
});

it('uses inverse ivory on forest and supports decorative marks at 32 dp', async () => {
  await act(async () => { tree = create(<BrandLogo variant="mark" width={32} inverse decorative />); });
  expect(tree.root.findByType('svg' as React.ElementType).props).toMatchObject({ accessible: false, accessibilityLabel: undefined, viewBox: '-80 -80 760 680' });
  expect(tree.root.findAllByType('path' as React.ElementType).map(path => path.props.fill)).toEqual(['#42D5A5', '#FCFBF7']);
});

it('preserves the filled v2 Journey path, destination dot and decorative ownership', async () => {
  await act(async () => { tree = create(<JourneyMotif />); });
  const master = readFileSync(new URL('../../assets/brand/journey.svg', import.meta.url), 'utf8');
  const paths = tree.root.findAllByType('path' as React.ElementType);
  expect(paths.map(path => path.props.fill)).toEqual(['#174D38', '#42D5A5', '#174D38']);
  for (const path of paths) {
    expect(master).toContain(`d="${path.props.d}"`);
    expect(path.props.stroke).toBeUndefined();
  }
  expect(tree.root.findByType('circle' as React.ElementType).props).toMatchObject({ cx: '277', cy: '220', r: '22', fill: '#42D5A5' });
  expect(tree.root.findByProps({ importantForAccessibility: 'no-hide-descendants' }).props).toMatchObject({ pointerEvents: 'none', accessible: false });
});

it('matches the supplied masters for every outlined letter, arch and lockup transform', () => {
  for (const variant of ['primary', 'horizontal'] as const) {
    const master = readFileSync(new URL(`../../assets/brand/${variant}.svg`, import.meta.url), 'utf8');
    for (const letter of brandGeometry.letters) {
      expect(master).toContain(`d="${letter.d}"`);
      expect(master).toContain(`transform="${letter.transform}"`);
    }
    expect(master).toContain(`d="${brandGeometry.arch}"`);
    expect(master).toContain(`d="${brandGeometry.crossbar}"`);
    for (const transform of [brandGeometry.lockups[variant].arch, brandGeometry.lockups[variant].wordmark]) expect(master).toContain(`transform="${transform}"`);
    expect(master).toContain(`viewBox="${brandGeometry.lockups[variant].viewBox}"`);
  }
});
