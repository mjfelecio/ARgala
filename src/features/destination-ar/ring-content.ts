import type { RingEntry } from './scene-geometry';
import type { Destination, DestinationMedia } from '@/features/destinations/catalog';
export type ReaderBlock = { kind: 'heading' | 'paragraph' | 'bullet' | 'callout'; text: string };
export type LocalizedReaderBlocks = Partial<Record<'en' | 'ja' | 'ko', readonly ReaderBlock[]>>;
export const EXHIBIT_GUIDE_IDS = {
  arrival: 'exhibit:guide:arrival',
  bestTime: 'exhibit:guide:best-time',
  safety: 'exhibit:guide:safety',
  activities: 'exhibit:guide:activities',
  preparation: 'exhibit:guide:preparation',
} as const;
export type ExhibitGuideSection = keyof typeof EXHIBIT_GUIDE_IDS;
export const exhibitGuideSections = Object.keys(EXHIBIT_GUIDE_IDS) as ExhibitGuideSection[];
const guideIds: ReadonlySet<string> = new Set(Object.values(EXHIBIT_GUIDE_IDS));
export const isExhibitGuide = (id: string) => guideIds.has(id);
export const EXHIBIT_HISTORY_ID = 'exhibit:history';

type ApprovedTile = NonNullable<Destination['ar']>['tiles'][number];
export type RingContent = RingEntry & { readerBlocks?: LocalizedReaderBlocks; guideEssentials?: LocalizedReaderBlocks; hasHistorySources?: true; restrictCapture?: true } & ({ titleKey: string; bodyKey: string; approved?: never } | { approved: Pick<ApprovedTile, 'title' | 'body' | 'presentation'> & { media?: readonly DestinationMedia[] }; titleKey?: never; bodyKey?: never });
