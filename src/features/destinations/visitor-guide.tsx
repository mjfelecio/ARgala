import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { localizedContent, type Destination } from './catalog';

/** Content lives in the page's existing scroll owner, including large CJK text. */
export function VisitorGuide({ destination }: { destination: Destination }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const guide = localizedContent(destination.visitorGuide, language)?.value;
  if (!guide) return null;
  return <View className="gap-5">
    {destination.requiresGuide && <Text className="font-sans text-base font-ui-semibold text-brand-strong">{t('destinations.guideRequired')}</Text>}
    {(['arrival', 'bestTime', 'activities', 'preparation', 'safety'] as const).map(section => <View key={section} className="gap-2">
      <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{t(`destinations.visitorGuide.${section}`)}</Text>
      {(typeof guide[section] === 'string' ? [guide[section]] : guide[section]).map((text, index) =>
        <Text key={index} selectable className="font-sans text-base text-foreground">{text}</Text>)}
    </View>)}
  </View>;
}
