import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { ViroImage, ViroNode } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import { chapterPresentation } from './chapter-presentation';
import { ArText } from './ar-text';
import { ChapterEmblem } from './chapter-emblem';
import { ExhibitFrame } from './exhibit-frame';
import type { InformationTile } from './information-tile';

export function ExhibitTile({ content, slot, enabled, style, onSelect, decorations = true, ordinal = 1, chapterCount = 1, opened = false }: ComponentProps<typeof InformationTile>) {
  const { t, i18n } = useTranslation();
  const chapter = chapterPresentation(content, i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key));
  const photo = chapter.media[0];
  const [failed, setFailed] = useState(false);
  const alive = useRef(false);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  return <ViroNode testID={`ring-tile-${content.id}`} position={slot.position} rotation={slot.rotation} onClick={enabled ? () => { if (alive.current) onSelect(content.id); } : undefined}>
    <ExhibitFrame width={0.71} height={0.71} decorations={decorations} interactiveSurface={enabled} />
    <ArText position={[0, 0.28, 0.006]} width={0.61} height={0.07} text={t('destinationStories.chapter', { current: ordinal, total: chapterCount })} style={style.text(3)} />
    {photo && !failed ? <ViroImage testID="exhibit-cover-photo" source={photo.source} width={0.59} height={0.30} position={[0, 0.075, 0.007]}
      resizeMode="ScaleToFit" renderingOrder={2} highAccuracyEvents ignoreEventHandling={!enabled}
      onError={() => { if (alive.current) setFailed(true); }} /> : <ChapterEmblem content={content} />}
    <ArText position={[0, -0.155, 0.01]} width={0.59} height={0.16} text={chapter.coverTitle} style={style.text(5.5, 'center', '600')} />
    {opened && <ArText testID={`ring-opened-${content.id}`} position={[0, -0.26, 0.01]} width={0.59} height={0.05} text={t('destinationStories.opened')} style={style.text(3)} />}
    <ArText position={[0, -0.315, 0.01]} width={0.61} height={0.05} text={t('destinationRing.tap')} style={style.text(3)} />
  </ViroNode>;
}
