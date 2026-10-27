import type { RingEntry } from './scene-geometry';
import type { Destination } from '@/features/destinations/catalog';
type ApprovedTile = NonNullable<Destination['ar']>['tiles'][number];
export type RingContent = RingEntry & ({ titleKey: string; bodyKey: string; approved?: never } | { approved: Pick<ApprovedTile, 'title' | 'body'>; titleKey?: never; bodyKey?: never });
