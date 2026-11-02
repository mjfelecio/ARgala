import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
import type { RingContent } from './ring-content';
import { developmentGalleryAssets } from './development-gallery-assets';
import { developmentRingContent } from './development-ring-content';
// The shared presentation shape calls this field "approved". These references
// explicitly confer no destination approval; only the development route loads it.
const reference = 'Development sample only; no destination approval; assets/development/ar-gallery/README.md';
const text = (value: string) => ({ value, approvalReference: reference });
const localized = (read: (values: typeof en | typeof ja | typeof ko) => string) => ({ en: text(read(en)), ja: text(read(ja)), ko: text(read(ko)) });
const campus = { id: 'sample-aclc-iriga', source: developmentGalleryAssets.campus,
  credit: 'Free2barredo · CC BY-SA 4.0 · resized', rightsReference: 'https://creativecommons.org/licenses/by-sa/4.0/', approvalReference: reference,
  alt: localized(values => values.destinationRing.samples.campus), caption: localized(values => values.destinationRing.samples.campus) };
const scenery = { id: 'sample-scenery', source: developmentGalleryAssets.scenery,
  credit: 'Paul Jarvis / Unsplash', rightsReference: 'https://unsplash.com/license', approvalReference: reference,
  alt: localized(values => values.destinationRing.samples.scenery), caption: localized(values => values.destinationRing.samples.scenery) };
export const developmentGalleryContent: readonly RingContent[] = [
  { id: 'overview', role: 'overview', approved: { title: localized(values => values.destinationRing.mock.overview.title), body: localized(values => values.destinationRing.mock.overview.body), presentation: 'gallery', media: [campus, scenery] } },
  { id: 'history', role: 'history', approved: { title: localized(values => values.destinationRing.mock.history.title), body: localized(values => values.destinationRing.mock.history.body), presentation: 'story', media: [scenery, campus] } },
  ...developmentRingContent.slice(2),
];
