import { createInstance } from 'i18next';
import { expect, it } from 'vitest';
import { localizationOptions } from '@/i18n/options';
import { ringCopy } from './ring-copy';
const approved = (value: string) => ({ value, approvalReference: 'synthetic approval' });
it('resolves approved content per locale and marks independent English fallback inside the native body', async () => {
 const i18n = createInstance(); await i18n.init({ ...localizationOptions, lng: 'ja' });
 const content = { id: 'overview', role: 'overview' as const, approved: { title: { en: approved('Overview'), ja: approved('概要') }, body: { en: approved('Approved English') } } };
 expect(ringCopy(content, 'title', 'ja', key => i18n.t(key))).toBe('概要');
 expect(ringCopy(content, 'body', 'ja', key => i18n.t(key))).toBe(`${i18n.t('destinations.englishFallback')}\n\nApproved English`);
 expect(ringCopy({ ...content, approved: { ...content.approved, body: {} } }, 'body', 'ja', key => i18n.t(key))).toBe('');
});
it('never turns a missing development locale key into panel content', () => {
 expect(ringCopy({ id: 'missing', titleKey: 'missing.title', bodyKey: 'missing.body' }, 'body', 'en', key => key, () => false)).toBe('');
});
