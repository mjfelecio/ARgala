import { ViroImage } from '@reactvision/react-viro';
import { holographicAssets } from './holographic-assets';
import type { RingContent } from './ring-content';
export function ChapterEmblem({ content }: { content: RingContent }) {
  const key = content.role ?? content.id;
  const source = key === 'overview' || key === 'history' || key === 'highlights' || key === 'visitor-notes' || key === 'facts' ? holographicAssets[key] : holographicAssets.chapter;
  return <ViroImage testID={`chapter-emblem-${content.id}`} source={source} position={[0, 0.12, 0.006]} width={0.19} height={0.19} renderingOrder={2} ignoreEventHandling />;
}
