import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { localizedContent, type Destination } from './catalog';

/** Content lives in the page's existing scroll owner, including large CJK text. */
export function VisitorGuide({ destination }: { destination: Destination }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const accent = useThemeColor('accent');
  const guide = localizedContent(destination.visitorGuide, language)?.value;
  if (!guide) return null;
  return <View className="gap-5">
    {destination.requiresGuide && <Text className="font-sans text-base font-ui-semibold text-brand-strong">{t('destinations.guideRequired')}</Text>}
    {(['arrival', 'bestTime', 'activities', 'preparation', 'safety'] as const).map(section => <View key={section} className="gap-2">
      <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{t(`destinations.visitorGuide.${section}`)}</Text>
      {typeof guide[section] === 'string' ? <Text selectable className="font-sans text-base text-foreground">{guide[section]}</Text>
        : guide[section].map((text, index) => <View key={index} className="flex-row items-start gap-3">
          <View className="min-h-6 w-5 items-center justify-center" accessible={false} importantForAccessibility="no-hide-descendants">
            <Ionicons name={section === 'preparation' ? 'square-outline' : section === 'safety' ? 'warning-outline' : 'ellipse'}
              size={section === 'activities' ? 6 : 20} color={accent} accessible={false} />
          </View>
          <Text selectable className="min-w-0 flex-1 font-sans text-base text-foreground">{text}</Text>
        </View>)}
    </View>)}
  </View>;
}
