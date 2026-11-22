import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { exhibitVisitorCopy } from '@/i18n/locales/ar-exhibit-visitor';
import { DestinationPhotoViewer } from './destination-photo-viewer';
import { destinationHistory, schoolPresentationHistoryScope } from './history-content';

const StyledImage = withUniwind(Image);

export function DestinationHistory({ destinationId }: { destinationId: string }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [viewer, setViewer] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const history = destinationHistory(destinationId, schoolPresentationHistoryScope);
  if (!history) return null;

  const { summary, visual, caption, media, creativeCommons } = history;
  const copy = exhibitVisitorCopy[language];
  return <View className="gap-2" testID="destination-history">
    <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{copy.history}</Text>
    <Text selectable className="font-sans text-base text-foreground">{summary[language]}</Text>
    {media && <>
      <Pressable testID="history-visual-open" className="items-center rounded-card bg-mint py-3 active:opacity-80"
        accessibilityRole="button" accessibilityLabel={`${copy.historyOpenImage}. ${media.alt[language]?.value ?? media.alt.en.value}`} onPress={() => setViewer(true)}>
        {imageFailed ? <Text className="font-sans text-base text-muted">{t('destinations.imageFailed')}</Text> :
          <StyledImage testID="history-visual" source={media.source} className="h-64 w-full" resizeMode="contain" accessible={false}
            onError={() => setImageFailed(true)} />}
      </Pressable>
      <Text selectable className="font-sans text-sm text-muted">{caption[language].value}</Text>
      {viewer && <DestinationPhotoViewer media={[media]} initialId={media.id} onClose={() => setViewer(false)}
        creditDetails={{
          scope: creativeCommons ? copy.historySchoolScope : destinationId === 'D10' ? copy.historySchoolPermission : copy.historySchoolUse,
          locator: visual.locator,
          license: creativeCommons && visual.license && visual.licenseUrl ? { label: visual.license, url: visual.licenseUrl } : undefined,
        }} />}
    </>}
  </View>;
}
