import { useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import type { Place } from '@/features/places/service';
import { FloatingSurface, PillAction } from '@/ui/clean-explorer';
import { colors, radii, space, typeScale } from '@/ui/theme';
export type HomePlaceSheetState = 'unsearched' | 'loading' | 'empty' | 'failed' | 'results' | 'selected' | 'route-loading' | 'route-ready' | 'route-failed';
export type HomePlaceSheetProps = {
  state: HomePlaceSheetState; selectedPlace: Place | null; hasSelection: boolean;
  canRequest: boolean; resultCount: number; errorKey?: string; detailsLoading?: boolean;
  selectionSummary?: string; locationStatus?: ReactNode; mapLoading?: boolean;
  route?: { distanceMeters: number; durationSeconds: number; warnings: string[] };
  attributions: ReactNode; onRetrySearch(): void; onClosePlace(): void; onDetails(): void;
  onWalk(): void; onOpenGoogle?(): void; onMeasuredHeight(height: number): void;
  maxHeight?: number;
};
export function HomePlaceSheet({ state, selectedPlace: place, hasSelection, canRequest, resultCount, errorKey, detailsLoading, selectionSummary, locationStatus, mapLoading, route, attributions, onRetrySearch, onClosePlace, onDetails, onWalk, onOpenGoogle, onMeasuredHeight, maxHeight }: HomePlaceSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const busy = state === 'loading' || state === 'route-loading';
  const routeContent = <>
      {state === 'route-loading' && <Message busy>{t('map.routeLoading')}</Message>}
      {route && <>
        <Message>{t('map.routeSummary', { meters: route.distanceMeters, minutes: Math.ceil(route.durationSeconds / 60) })}</Message>
        <Message>{t('map.walkingCaution')}</Message>
        {route.warnings.map((warning, index) => <Message key={index}>{warning}</Message>)}
      </>}
  </>;
  return <FloatingSurface testID="home-place-sheet" style={[styles.sheet, { maxHeight: maxHeight === undefined ? (expanded ? '60%' : '42%') : Math.min(maxHeight, expanded ? maxHeight : Math.max(160, maxHeight * 0.65)) }]}
    onLayout={(event) => onMeasuredHeight(event.nativeEvent.layout.height)}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.section}>{t('map.title')}</Text>
        <PillAction label={t(expanded ? 'map.collapse' : 'map.expand')} variant="secondary" onPress={() => setExpanded(value => !value)} />
      </View>
      {locationStatus}
      {mapLoading && <Message busy>{t('map.loading')}</Message>}
      {state === 'unsearched' && <Message>{t('map.start')}</Message>}
      {state === 'loading' && <Message busy>{t('map.searching')}</Message>}
      {state === 'empty' && <Message>{t('map.empty')}</Message>}
      {state === 'results' && <Message>{t('map.results', { count: resultCount })}</Message>}
      {errorKey && <Message error>{t(errorKey)}</Message>}
      {state === 'failed' && <PillAction label={t('common.retry')} variant="outline" disabled={!canRequest || busy} onPress={onRetrySearch} />}
      {hasSelection && <>
        {detailsLoading && <Message busy>{t('map.details')}</Message>}
        {!place && <><Message>{t('map.selectionUnavailable')}</Message>{routeContent}</>}
        {place && <>
          <Text style={styles.title}>{place.name}</Text>
          {routeContent}
          {selectionSummary && <Text style={styles.body}>{selectionSummary}</Text>}
          {expanded && <>
            {place.address && <Text style={styles.body}>{place.address}</Text>}
            {place.description && <Text style={styles.body}>{place.description}</Text>}
            {place.mapsUri && onOpenGoogle && <PillAction label={t('map.openGoogle')} variant="outline" onPress={onOpenGoogle} />}
          </>}
          <PillAction label={t('map.walk')} onPress={onWalk} disabled={!canRequest} busy={state === 'route-loading'} />
        </>}
        {(!place || expanded || (errorKey && state === 'selected')) && <PillAction label={t('ar.more')} variant="outline" onPress={onDetails} disabled={!canRequest} busy={detailsLoading} />}
        <PillAction label={t('map.closePlace')} variant="secondary" onPress={onClosePlace} />
      </>}
      {!hasSelection && routeContent}
      {(expanded || !hasSelection) && <Text style={styles.metadata}>{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>}
      {attributions}
    </ScrollView>
  </FloatingSurface>;
}
function Message({ children, busy, error }: { children: ReactNode; busy?: boolean; error?: boolean }) {
  return <View style={styles.message}>{busy && <ActivityIndicator color={colors.brandPrimary} />}<Text accessibilityLiveRegion="polite" style={[styles.body, error && styles.error]}>{children}</Text></View>;
}
const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, flexShrink: 1, paddingTop: space.md },
  heading: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center', justifyContent: 'space-between' },
  section: { ...typeScale.card, color: colors.brandStrong, flexShrink: 1 },
  scroll: { flexGrow: 0, flexShrink: 1 }, content: { padding: space.lg, gap: space.md },
  title: { ...typeScale.title, color: colors.text }, body: { ...typeScale.body, color: colors.textSecondary },
  metadata: { ...typeScale.metadata, color: colors.textSecondary },
  message: { gap: space.sm }, error: { color: colors.danger },
});
