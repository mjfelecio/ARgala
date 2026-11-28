import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeOverlay = withUniwind(SafeAreaView);
export function ArUtilityChrome({ children, actions, underHeader, bottom, viewportHeight, titleKey = 'destinationAr.title', title, onReturn, onExit, appearance = 'camera' }: { appearance?: 'page' | 'camera'; children: React.ReactNode; actions?: React.ReactNode; underHeader?: React.ReactNode; bottom?: React.ReactNode; viewportHeight?: number; titleKey?: string; title?: string; onReturn?(): void; onExit?(): void }) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  const leave = () => { onExit?.(); if (onReturn) { onReturn(); return; } if (router.canGoBack()) router.back(); else router.navigate('/profile'); };
  const [bottomHeight, setBottomHeight] = useState(0);
  const bottomMaxHeight = viewportHeight && viewportHeight > 0 ? viewportHeight * 0.4 : undefined;
  const bottomOccupation = Math.min(bottomHeight, bottomMaxHeight ?? bottomHeight);
  const maxHeight = viewportHeight && viewportHeight > 0 ? Math.max(0, viewportHeight - (bottom ? bottomOccupation : 0)) : undefined;
  if (appearance === 'page') return <SafeOverlay className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('destinationAr.exit')} onPress={leave}><Ionicons name="arrow-back" color={accent} size={24} accessible={false} /></Button>
      <Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-brand-strong">{title ?? t(titleKey)}</Text>
    </View>
    <ScrollView contentContainerClassName="gap-3 px-4 pb-8" className="flex-1">{children}</ScrollView>
  </SafeOverlay>;
  // Keep overlay hit bounds at visible controls, leaving the measured native
  // scene reachable below them. box-none alone is not a physical touch test.
  return <><SafeOverlay testID="ar-top-utilities" style={{ maxHeight }} className="absolute left-0 right-0 top-0" edges={['top', 'left', 'right']} pointerEvents="box-none">
    <View className="mx-4 mt-2 shrink-0 flex-row items-center gap-2 rounded-card bg-ar-panel p-2">
      <Button variant="secondary" className="min-h-12" accessibilityLabel={t('destinationAr.exit')} onPress={leave}>
        <Button.Label>{t('destinationStories.exit')}</Button.Label>
      </Button>
      <Text accessibilityRole="header" accessibilityLabel={title ?? t(titleKey)} numberOfLines={2} className="grow shrink font-sans text-card font-ui-semibold text-white">{title ?? t(titleKey)}</Text>
      {actions}
    </View>
    {underHeader}
    <ScrollView testID="ar-utility-body" className="mt-3 grow-0 shrink" contentContainerClassName="gap-3 px-4" pointerEvents="box-none">{children}</ScrollView>
  </SafeOverlay>
    {bottom && <SafeOverlay testID="ar-bottom-utilities" style={{ maxHeight: bottomMaxHeight }} onLayout={event => setBottomHeight(event.nativeEvent.layout.height)} className="absolute bottom-0 left-0 right-0" edges={['bottom', 'left', 'right']} pointerEvents="box-none">
      <ScrollView testID="ar-bottom-utility-body" className="grow-0 shrink" contentContainerClassName="items-center px-4 pb-3" pointerEvents="box-none">
        <View className="flex-row flex-wrap items-center justify-center gap-3 rounded-card bg-ar-panel p-2">{bottom}</View>
      </ScrollView>
    </SafeOverlay>}
  </>;
}
