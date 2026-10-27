import { localizedContent } from '@/features/destinations/catalog';
import type { RingContent } from './ring-content';
export function ringCopy(content: RingContent, field: 'title' | 'body' = 'body', locale = 'en', translate: (key: string) => string = key => key, exists: (key: string) => boolean = () => true): string {
  if (content.approved) {
    const language = locale.startsWith('ja') ? 'ja' : locale.startsWith('ko') ? 'ko' : 'en';
    const value = localizedContent(content.approved[field], language);
    if (!value) return '';
    const fallback = value.englishFallback || localizedContent(content.approved.title, language)?.englishFallback;
    return field === 'body' && fallback ? `${translate('destinations.englishFallback')}\n\n${value.value}` : value.value;
  }
  const key = field === 'title' ? content.titleKey : content.bodyKey;
  return key && exists(key) ? translate(key) : '';
}
