import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { CircleAction, FloatingSurface, PillAction } from './clean-explorer';

vi.mock('react-native', () => ({ Pressable: 'button', Text: 'text', View: 'view', ActivityIndicator: 'progress', StyleSheet: { create: (s: unknown) => s } }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let tree: ReactTestRenderer;
afterEach(async () => { await act(async () => tree?.unmount()); vi.restoreAllMocks(); });
it.each(['primary', 'secondary', 'outline'] as const)('renders an accessible %s action and dispatches its callback', async (variant) => {
 const onPress = vi.fn();
 await act(async () => { tree = create(React.createElement(PillAction, { label: 'Search', accessibilityLabel: 'Search nearby', variant, onPress })); });
 const button = tree.root.findByType('button');
 expect(button.props.accessibilityRole).toBe('button');
 expect(button.props.accessibilityLabel).toBe('Search nearby');
 expect(button.props.style({ pressed: false })).toEqual(expect.arrayContaining([expect.objectContaining({ minHeight: 56 })]));
 await act(async () => button.props.onPress()); expect(onPress).toHaveBeenCalledOnce();
 expect(button.props.style({ pressed: true })).not.toEqual(button.props.style({ pressed: false }));
});
it.each([{ disabled: true }, { busy: true }])('blocks interaction for %o while retaining its label', async (state) => {
 const onPress = vi.fn();
 await act(async () => { tree = create(React.createElement(PillAction, { label: 'Search', onPress, variant: 'primary', ...state })); });
 const button = tree.root.findByType('button');
 expect(button.props.disabled).toBe(true); expect(button.props.accessibilityState.disabled).toBe(true);
 await act(async () => button.props.onPress?.()); expect(onPress).not.toHaveBeenCalled();
 expect(button.props.accessibilityLabel).toBe('Search');
 expect(tree.root.findAllByType('progress')).toHaveLength('busy' in state ? 1 : 0);
});
it('gives circle actions a labeled 48-unit target and forwards surface layout props', async () => {
 const onLayout = vi.fn();
 await act(async () => { tree = create(React.createElement(FloatingSurface, { onLayout }, React.createElement(CircleAction, { label: 'Recenter', onPress: vi.fn(), icon: React.createElement('icon') }))); });
 const button = tree.root.findByType('button');
 expect(button.props.accessibilityLabel).toBe('Recenter');
 expect(button.props.style({ pressed: false })).toEqual(expect.arrayContaining([expect.objectContaining({ minHeight: 48, minWidth: 48 })]));
 tree.root.findByType('view').props.onLayout(); expect(onLayout).toHaveBeenCalledOnce();
});
