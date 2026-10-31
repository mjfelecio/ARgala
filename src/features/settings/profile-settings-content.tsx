import { JournalProfileEntry } from '@/features/journal/profile-entry';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import SettingsForm from './settings-form';
import { ViroSpikeLaunch, ViroRingLaunch } from '@/features/destination-ar/dev-entry';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export function ProfileSettingsContent({ entry }: { entry: 'tab' | 'stack' }) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  return <StyledSafeAreaView className="flex-1 bg-white" edges={entry === 'stack' ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      {entry === 'stack' && <Button isIconOnly variant="ghost" accessibilityLabel={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}><Ionicons name="arrow-back" color={accent} size={24} /></Button>}
      {entry === 'tab' && <Ionicons name="compass-outline" color={accent} size={28} accessible={false} />}
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('settings.profileTitle')}</Text>
    </View>
    <SettingsForm>
      {entry === 'tab' && <><ViroRingLaunch /><ViroSpikeLaunch /></>}
      <JournalProfileEntry />
    </SettingsForm>
  </StyledSafeAreaView>;
}
