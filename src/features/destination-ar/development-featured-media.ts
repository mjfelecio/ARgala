import type { DestinationId } from '@/features/destinations/catalog';
import type { RingContent } from './ring-content';
import content from './featured-presentation-content.json';
import { presentationPhotoAssets } from './featured-presentation-media-assets';

// Presentation content uses the existing scene and gallery model. This adapter
// does not change arrival, Passport, native configuration, or production gates.
const reference = 'ARgala college presentation content, 2026-11-13';
const value = (text: string) => ({ value: text, approvalReference: reference });
const translated = (text: { en: string; ja: string; ko: string }) => ({
  en: value(text.en), ja: value(text.ja), ko: value(text.ko),
});
export function previewStoryContent(id: DestinationId): readonly RingContent[] {
  const destination = content.destinations.find(item => item.id === id);
  if (!destination) return [];
  return destination.chapters.map((chapter, index): RingContent => ({
    id: chapter.id,
    ...(index === 0 ? { role: 'overview' as const } : {}),
    approved: {
      title: translated(chapter.title), body: translated(chapter.body),
      presentation: 'story',
      media: chapter.mediaIds.map(mediaId => {
        const photo = content.media.find(item => item.id === mediaId);
        if (!photo) throw new Error(`Missing presentation photo: ${mediaId}`);
        return {
          id: photo.id,
          source: presentationPhotoAssets[mediaId as keyof typeof presentationPhotoAssets],
          credit: photo.credit, rightsReference: photo.sourceUrl,
          approvalReference: reference,
          alt: translated(photo.alt), caption: translated(photo.caption),
        };
      }),
    },
  }));
}
