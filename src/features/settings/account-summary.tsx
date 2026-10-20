import Ionicons from '@expo/vector-icons/Ionicons';
import { Surface } from 'heroui-native/surface';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useAuth } from '@/features/auth/provider';

export function AccountSummary() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const onAccent = useThemeColor('accent-foreground');
  const email = session?.user.email?.trim();
  const initial = email ? Array.from(email)[0].toLocaleUpperCase() : null;
  return <Surface variant="secondary" className="flex-row items-center gap-4 p-5">
    <View className="min-h-14 min-w-14 items-center justify-center rounded-pill bg-accent p-3" accessible={false} importantForAccessibility="no-hide-descendants">
      {initial ? <Text className="font-sans text-title font-semibold text-accent-foreground">{initial}</Text> : <Ionicons name="person-outline" color={onAccent} size={28} />}
    </View>
    <View className="shrink grow gap-1">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-sans text-card font-semibold text-foreground">{t('settings.myAccount')}</Text>
        {session && <Text className="font-sans text-xs font-semibold text-brand-strong">{t('settings.signedIn')}</Text>}
      </View>
      <Text selectable className="font-sans text-sm text-muted">{email || t('settings.emailUnavailable')}</Text>
    </View>
  </Surface>;
}
