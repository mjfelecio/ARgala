import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { useSettings } from '@/features/settings/provider';
import { useOpenProviderLink } from '@/features/map/attributions';
import { exhibitVisitorCopy } from '@/i18n/locales/ar-exhibit-visitor';
import { DestinationPhotoViewer } from './destination-photo-viewer';
import { destinationHistory, schoolPresentationHistoryScope } from './history-content';

const StyledImage = withUniwind(Image);

export function DestinationHistory({ destinationId }: { destinationId: string }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const accent = useThemeColor('accent');
  const open = useOpenProviderLink();
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const history = destinationHistory(destinationId, schoolPresentationHistoryScope);
  if (!history) return null;

  const { entry, visual, caption, media, creativeCommons, citations } = history;
  const copy = exhibitVisitorCopy[language];
  return <View className="gap-3" testID="destination-history">
    <Button variant="secondary" className="h-auto min-h-12 justify-between py-3" accessibilityLabel={copy.history}
      accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)}>
      <Button.Label>{copy.history}</Button.Label>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={accent} accessible={false} />
    </Button>
    {expanded && <View className="gap-3">
      <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{entry.title[language]}</Text>
      <Text selectable className="font-sans text-base text-foreground">{entry.text[language]}</Text>
      {media && <Pressable testID="history-visual-open" className="items-center gap-2 rounded-card bg-mint py-3 active:opacity-80"
        accessibilityRole="button" accessibilityLabel={`${copy.historyOpenImage}. ${media.alt[language]?.value ?? media.alt.en.value}`} onPress={() => setViewer(true)}>
        {imageFailed ? <Text className="font-sans text-base text-muted">{t('destinations.imageFailed')}</Text> :
          <StyledImage testID="history-visual" source={media.source} className="h-64 w-full" resizeMode="contain" accessible={false}
            onError={() => setImageFailed(true)} />}
      </Pressable>}
      <Text selectable className="font-sans text-base text-foreground">{caption[language].value}</Text>
      {media && <Text selectable className="font-sans text-sm text-muted">{media.credit}</Text>}
      <Text selectable className="font-sans text-sm text-muted">{visual.locator}</Text>
      {media && !creativeCommons && <Text className="font-sans text-sm text-muted">{copy.historySchoolUse}</Text>}
      <HistoryLink label={media ? copy.historyVisualSource : copy.historyFigure} onPress={() => open(visual.sourceUrl)} />
      {creativeCommons && visual.license && visual.licenseUrl && <HistoryLink label={visual.license} onPress={() => open(visual.licenseUrl!)} />}
      <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{copy.historySources}</Text>
      {citations.filter(source => source.url !== visual.sourceUrl).map(source => <View key={source.id} className="gap-1">
        <HistoryLink label={source.title} onPress={() => open(source.url)} />
        <Text selectable className="font-sans text-sm text-muted">{source.publisher} · {source.date} · {source.locator}</Text>
      </View>)}
      {viewer && media && <DestinationPhotoViewer media={[media]} initialId={media.id} onClose={() => setViewer(false)} />}
    </View>}
  </View>;
}

function HistoryLink({ label, onPress }: { label: string; onPress(): void }) {
  return <Button variant="ghost" className="h-auto min-h-12 justify-start py-3" accessibilityRole="link" accessibilityLabel={label} onPress={onPress}>
    <Button.Label className="shrink">{label}</Button.Label>
  </Button>;
}
