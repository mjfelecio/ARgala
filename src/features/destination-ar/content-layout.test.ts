import { expect, it } from 'vitest';
import { paginate, reflowCursor } from './content-layout';
it.each(['en', 'ja', 'ko'])('retains all source text and valid page bounds for %s', locale => {
  const text = ({ en: 'Development mock. No visitor facts. '.repeat(30), ja: '開発用の例です。実際の歴史情報ではありません。'.repeat(30), ko: '개발용 예시입니다. 실제 역사 정보가 아닙니다. '.repeat(30) })[locale]!;
  const pages = paginate(text, 'standard');
  expect(pages.length).toBeGreaterThan(1);
  expect(pages.map(page => text.slice(page.start, page.end)).join('')).toBe(text);
  expect(pages.every(page => page.text.split('\n').length <= 5)).toBe(true);
});
it('keeps emoji, combining accents, Hangul jamo and flags intact even at wraps', () => {
  const text = '👨‍👩‍👧‍👦e\u0301가🇰🇷'.repeat(50);
  const pages = paginate(text, 'large');
  for (const page of pages) {
    expect(page.text).not.toMatch(/^[\u0300-\u036f\u200d]/u);
    expect(page.text.replaceAll('\n', '')).toMatch(/^(?:👨‍👩‍👧‍👦|e\u0301|가|🇰🇷)+$/u);
  }
  expect(pages.map(p => text.slice(p.start, p.end)).join('')).toBe(text);
});
it('wraps long unbroken text, preserves explicit newlines and handles empty text', () => {
  const text = 'x'.repeat(600) + '\n\n' + '끝';
  const pages = paginate(text, 'standard');
  expect(pages.every(p => p.text.split('\n').every(line => line.length <= 44))).toBe(true);
  expect(pages.map(p => text.slice(p.start, p.end)).join('')).toBe(text);
  expect(paginate('', 'standard')).toEqual([{ start: 0, end: 0, text: '' }]);
  expect(() => paginate('x'.repeat(24001), 'standard')).toThrow();
});
it('preserves source position on size reflow and clamps ordinal page after locale changes', () => {
  const text = 'A long labeled mock paragraph. '.repeat(100);
  const old = paginate(text, 'small'); const next = paginate(text, 'large');
  const current = { page: 3, offset: old[3].start, locale: 'en', size: 'small' as const };
  const reflowed = reflowCursor(next, current, 'en', 'large');
  expect(next[reflowed.page].start).toBeLessThanOrEqual(current.offset);
  expect(next[reflowed.page].end).toBeGreaterThan(current.offset);
  expect(reflowCursor(paginate('短い例', 'large'), current, 'ja', 'large').page).toBe(0);
});

it.each(['en', 'ja', 'ko'])('lays out actual %s development resources without losing text during reflow', async locale => {
  const resource = await import(`../../i18n/locales/${locale}.json`);
  for (const sample of Object.values(resource.default.destinationRing.mock) as { body: string }[]) {
    for (const size of ['small', 'standard', 'large'] as const) {
      const pages = paginate(sample.body, size);
      expect(pages.length).toBeGreaterThan(1);
      expect(pages.map(page => sample.body.slice(page.start, page.end)).join('')).toBe(sample.body);
    }
  }
});
