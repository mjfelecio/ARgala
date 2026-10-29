import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image, Text, View, type LayoutChangeEvent } from 'react-native';
import { Card } from 'heroui-native/card';
import { useTranslation } from 'react-i18next';
import { Screen, Notice, Action } from '@/ui/shared';
import { useSettings } from '@/features/settings/provider';
import { destinationName, localizedContent, type DestinationMedia } from '@/features/destinations/catalog';
import { approvedArContent } from '@/features/destinations/ar-content';
import type { PreparedArEntry } from './admission-store';

/** Mounted only by the native preflight's definite UNSUPPORTED branch. No camera or live-AR exemption. */
export function ReadOnlyFallback({ entry, eligible, running, onEstablished, onExit, guidance, feedback }: {
  entry: PreparedArEntry; eligible: boolean; running: boolean; onEstablished(): void; onExit(): void;
  guidance?: React.ReactNode; feedback?: React.ReactNode;
}) {
  const { t } = useTranslation(); const { language } = useSettings();
  const valid = entry.kind === 'approved' && !entry.simulated && entry.identity.provenance === 'verified' && entry.identity.destinationId === entry.destination.id;
  const emitted = useRef<PreparedArEntry | null>(null);
  return <Screen>
    <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{destinationName(entry.destination)}</Text>
    <Notice>{t('fallback.unsupported')}</Notice>
    <Action title={t('arrival.returnToMap')} onPress={onExit} />
    {valid && eligible && running ? <AuthorizedReader entry={entry} language={language} guidance={guidance} feedback={feedback}
      onEstablished={() => { if (emitted.current !== entry) { emitted.current = entry; onEstablished(); } }} />
      : <><Notice>{t('fallback.verify')}</Notice>{guidance}</>}
  </Screen>;
}

/** Closing either live gate unmounts this authorization owner. Resume cannot
 * render a previously authorized page while the new lease check is pending. */
function AuthorizedReader({ entry, language, guidance, feedback, onEstablished }: {
  entry: PreparedArEntry; language: 'en' | 'ja' | 'ko'; guidance?: React.ReactNode; feedback?: React.ReactNode; onEstablished(): void;
}) {
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState<PreparedArEntry | null>(null);
  const owner = useRef<PreparedArEntry | null>(null);
  useLayoutEffect(() => { owner.current = entry; return () => { owner.current = null; }; }, [entry]);
  useEffect(() => {
    let current = true;
    let fresh = false; try { fresh = entry.authorizeMount(); } catch { /* Fail closed. */ }
    void Promise.resolve().then(() => { if (current) setAuthorized(fresh ? entry : null); });
    return () => { current = false; };
  }, [entry]);
  const tiles = authorized === entry ? approvedArContent(entry.destination, language) : [];
  function establish(event: LayoutChangeEvent) {
    if (owner.current !== entry || !tiles.length || event.nativeEvent.layout.width <= 0 || event.nativeEvent.layout.height <= 0) return;
    let fresh = false; try { fresh = entry.authorizeMount(); } catch { /* Fail closed. */ }
    if (fresh) onEstablished();
  }
  return tiles.length ? <View testID="eligible-read-only-content" className="gap-4" onLayout={establish}>
    {tiles.map(tile => <Card key={tile.id} className="gap-3 p-4 shadow-none">
      <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{tile.title}</Text>
      {tile.englishFallback && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
      <Text selectable className="font-sans text-base text-foreground">{tile.body}</Text>
      {(entry.destination.ar?.tiles.find(source => source.id === tile.id)?.mediaIds ?? []).map(id => {
        const media = entry.destination.media?.find(item => item.id === id);
        return media ? <ReaderImage key={id} media={media} language={language} /> : null;
      })}
    </Card>)}
    {feedback}
  </View> : <><Notice>{t('fallback.verify')}</Notice>{guidance}</>;
}

function ReaderImage({ media, language }: { media: DestinationMedia; language: 'en' | 'ja' | 'ko' }) {
  const { t } = useTranslation(); const [failed, setFailed] = useState(false);
  const alt = localizedContent(media.alt, language); const caption = localizedContent(media.caption, language);
  return <View className="gap-2">
    {failed ? <Notice>{t('destinationRing.imageFailed')}</Notice> : <Image source={media.source} accessible accessibilityLabel={alt?.value}
      className="h-48 w-full" resizeMode="contain" onError={() => setFailed(true)} />}
    {caption && <Text className="font-sans text-base text-foreground">{caption.value}</Text>}
    {(alt?.englishFallback || caption?.englishFallback) && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
    <Text className="font-sans text-sm text-muted">{t('destinationRing.imageCredit', { credit: media.credit })}</Text>
  </View>;
}
