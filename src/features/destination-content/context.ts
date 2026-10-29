import { createContext, useCallback, useContext } from 'react';
import { getDestination } from '@/features/destinations/catalog';
import { resolveContent, type ContentManifest } from './model';
import type { ContentErrorCode } from './service';

export type DestinationContentState = {
  manifest: ContentManifest | null; ready: boolean; checking: boolean; canCheck: boolean; authenticated: boolean;
  message: 'content.bundled' | 'content.cached' | 'content.current' | 'content.noUpdates';
  error: ContentErrorCode | 'content.loadFailed' | null; checkUpdates(): Promise<void>;
};
export const DestinationContentContext = createContext<DestinationContentState | null>(null);
export const useDestinationContent = () => useContext(DestinationContentContext);
export function useDestinationLookup() {
  const manifest = useDestinationContent()?.manifest ?? null;
  return useCallback((id: unknown) => resolveContent(getDestination(id), manifest), [manifest]);
}
