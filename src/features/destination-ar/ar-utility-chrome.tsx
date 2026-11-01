import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeOverlay = withUniwind(SafeAreaView);
export function ArUtilityChrome({ children, actions, bottom, viewportHeight, titleKey = 'destinationAr.title', title, onReturn, onExit }: { children: React.ReactNode; actions?: React.ReactNode; bottom?: React.ReactNode; viewportHeight?: number; titleKey?: string; title?: string; onReturn?(): void; onExit?(): void }) {
  const { t } = useTranslation();
  const [bottomHeight, setBottomHeight] = useState(0);
  const maxHeight = viewportHeight && viewportHeight > 0 ? Math.max(0, viewportHeight - (bottom ? bottomHeight : 0)) : undefined;
  // Keep overlay hit bounds at visible controls, leaving the measured native
  // scene reachable below them. box-none alone is not a physical touch test.
  return <><SafeOverlay testID="ar-top-utilities" style={{ maxHeight }} className="absolute left-0 right-0 top-0" edges={['top', 'left', 'right']} pointerEvents="box-none">
    <View className="mx-4 mt-2 shrink-0 flex-row items-center gap-2 rounded-card bg-ar-panel p-2">
      <Button variant="secondary" className="min-h-12" accessibilityLabel={t('destinationAr.exit')} onPress={() => { onExit?.(); if (onReturn) { onReturn(); return; } if (router.canGoBack()) router.back(); else router.navigate('/profile'); }}>
        <Button.Label>{t('destinationStories.exit')}</Button.Label>
      </Button>
      <Text accessibilityRole="header" accessibilityLabel={title ?? t(titleKey)} numberOfLines={2} className="grow shrink font-sans text-card font-semibold text-white">{title ?? t(titleKey)}</Text>
      {actions}
    </View>
    <ScrollView testID="ar-utility-body" className="grow-0 shrink">{children}</ScrollView>
  </SafeOverlay>
    {bottom && <SafeOverlay testID="ar-bottom-utilities" onLayout={event => setBottomHeight(event.nativeEvent.layout.height)} className="absolute bottom-0 left-0 right-0" edges={['bottom', 'left', 'right']} pointerEvents="box-none">
      <View className="items-center px-4 pb-3" pointerEvents="box-none"><View className="flex-row flex-wrap items-center justify-center gap-3 rounded-card bg-ar-panel p-2">{bottom}</View></View>
    </SafeOverlay>}
  </>;
}
