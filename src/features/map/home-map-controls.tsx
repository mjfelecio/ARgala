import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleAction, FloatingSurface, PillAction } from '@/ui/clean-explorer';
import { colors, space, typeScale } from '@/ui/theme';
export type HomeMapControlsProps = {
  onSearchNearby(): void; onRecenter(): void; onOpenAr(): void; onOpenSettings(): void;
  canSearch: boolean; searching: boolean; onLayout?(event: LayoutChangeEvent): void;
};
export function HomeMapControls({ onSearchNearby, onRecenter, onOpenAr, onOpenSettings, canSearch, searching, onLayout }: HomeMapControlsProps) {
  const { t } = useTranslation();
  return <View style={styles.wrapper} onLayout={onLayout} pointerEvents="box-none">
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <FloatingSurface style={styles.brand}><Text style={styles.wordmark}>ARgala</Text><Text style={styles.subtitle}>{t('map.explore')}</Text></FloatingSurface>
        <CircleAction label={t('map.settings')} onPress={onOpenSettings} icon={<Text style={styles.settingsIcon}>☷</Text>} />
      </View>
      <PillAction label={t('map.search')} onPress={onSearchNearby} variant="outline" disabled={!canSearch} busy={searching} />
      <View style={styles.row}>
        <View style={styles.ar}><PillAction label={t('map.camera')} onPress={onOpenAr} variant="primary" /></View>
        <PillAction label={t('map.recenter')} onPress={onRecenter} variant="secondary" />
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  wrapper: { maxHeight: '40%', flexShrink: 1, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  scroll: { flexGrow: 0 }, content: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexShrink: 1, paddingHorizontal: space.lg, paddingVertical: space.sm },
  wordmark: { ...typeScale.heading, color: colors.brandStrong }, subtitle: { ...typeScale.metadata, color: colors.textSecondary },
  settingsIcon: { fontSize: 24, color: colors.brandStrong }, ar: { flexGrow: 1, flexShrink: 1 },
});
