import type { RingEntry } from './scene-geometry';
import type { Destination, DestinationMedia } from '@/features/destinations/catalog';
export const EXHIBIT_VISIT_PLAN_ID = 'exhibit:visit-plan';
export const EXHIBIT_HISTORY_ID = 'exhibit:history';

type ApprovedTile = NonNullable<Destination['ar']>['tiles'][number];
export type RingContent = RingEntry & { hasHistorySources?: true; restrictCapture?: true } & ({ titleKey: string; bodyKey: string; approved?: never } | { approved: Pick<ApprovedTile, 'title' | 'body' | 'presentation'> & { media?: readonly DestinationMedia[] }; titleKey?: never; bodyKey?: never });
