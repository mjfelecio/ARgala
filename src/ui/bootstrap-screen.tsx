import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { BrandLogo } from './brand-logo';
import { StatusRow } from './status-row';

const SafeArea = withUniwind(SafeAreaView);
/** Presentation only; providers retain their own hydration/retry ownership. */
export function BootstrapScreen() {
  const { t } = useTranslation();
  return <SafeArea className="flex-1 items-center justify-center gap-12 bg-page px-8">
    <BrandLogo variant="primary" width={184} />
    <View className="w-full max-w-72"><StatusRow busy centered>{t('exploreCleanup.preparing')}</StatusRow></View>
  </SafeArea>;
}
