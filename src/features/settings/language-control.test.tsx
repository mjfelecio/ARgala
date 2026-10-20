import { withHeroUI } from '@/test/native-ui';
import * as React from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { LanguageControl } from './language-control';

it('uses exclusive accessible language rows without changing the global locale', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false });
  const translations = createInstance();
  await translations.use(initReactI18next).init({ ...localizationOptions, lng: 'en', react: { useSuspense: false } });
  const changed = vi.fn();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  let tree!: ReturnType<typeof create>;
  try {
    await act(async () => { tree = create(<I18nextProvider i18n={translations}>{withHeroUI(<LanguageControl value="en" onChange={changed} />)}</I18nextProvider>); });
    const rows = tree.root.findAllByType('button').filter(node => node.props.role === 'radio');
    expect(rows.map(node => node.props.accessibilityLabel)).toEqual(['English', '한국어', '日本語']);
    expect(rows.map(node => node.props['aria-checked'])).toEqual([true, false, false]);
    await act(async () => rows[1].props.onPress());
    expect(changed).toHaveBeenCalledExactlyOnceWith('ko');
    expect(translations.language).toBe('en');
  } finally { await act(async () => tree?.unmount()); error.mockRestore(); }
});
