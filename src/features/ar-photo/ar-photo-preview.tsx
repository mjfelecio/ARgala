import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PHOTO_DEADLINE_MS } from './controller';
import type { PhotoSnapshot } from './types';

const StyledImage = withUniwind(Image);
const SafePreview = withUniwind(SafeAreaView);
type Props = { state: PhotoSnapshot & { photoUri: string }; onSave(): void; onShare(): void; onDiscard(): void; onPreviewFailed(): void };

/** Mount keyed by the owned photo URI. Native bitmap callbacks and the display
 * deadline belong to this preview, never a later capture or frame owner. */
export function ArPhotoPreview({ state, onSave, onShare, onDiscard, onPreviewFailed }: Props) {
  const { t } = useTranslation(); const { height } = useWindowDimensions(); const insets = useSafeAreaInsets();
  const ink = useThemeColor('foreground'); const onAccent = useThemeColor('accent-foreground');
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const attempt = useRef({ active: false, pending: true, timer: undefined as ReturnType<typeof setTimeout> | undefined });
  const failure = useRef(onPreviewFailed);
  useLayoutEffect(() => { failure.current = onPreviewFailed; }, [onPreviewFailed]);
  const finish = useCallback((success: boolean) => {
    const owner = attempt.current;
    if (!owner.active || !owner.pending) return;
    owner.pending = false; clearTimeout(owner.timer);
    setImageState(success ? 'ready' : 'failed');
    if (!success) failure.current();
  }, []);
  useLayoutEffect(() => {
    const owner = attempt.current; owner.active = true;
    owner.timer = setTimeout(() => finish(false), PHOTO_DEADLINE_MS);
    return () => { owner.active = false; clearTimeout(owner.timer); };
  }, [finish]);
  const busy = state.busy !== null;
  const unavailable = imageState !== 'ready' || state.error === 'preview-failed';
  const canvasHeight = Math.max(220, Math.min(560, (height - insets.top - insets.bottom) * 0.58));
  const operation = state.busy === 'save' ? 'saving' : state.busy === 'share' ? 'sharing' : null;
  return <Modal visible onRequestClose={onDiscard}>
    <SafePreview className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView testID="ar-photo-preview-scroll" className="flex-1" contentContainerClassName="grow gap-5 p-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-pill bg-mint" accessible={false}>
            <Ionicons name="image-outline" size={24} color={ink} />
          </View>
          <View className="grow shrink gap-1">
            <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('arPhoto.preview')}</Text>
            <Text className="font-sans text-sm text-muted">{t('arPhoto.review')}</Text>
          </View>
        </View>
        <View testID="ar-photo-canvas" style={{ height: canvasHeight }} className="w-full overflow-hidden rounded-card bg-mint">
          {imageState !== 'failed' && <StyledImage source={{ uri: state.photoUri }} resizeMode="contain" className="size-full" accessibilityLabel={t('arPhoto.image')} onLoad={() => finish(true)} onError={() => finish(false)} />}
          {imageState === 'loading' && <View className="absolute inset-0 items-center justify-center gap-3 bg-mint p-5" accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
            <Spinner size="md" /><Text className="text-center font-sans text-sm text-brand-strong">{t('arPhoto.loadingPreview')}</Text>
          </View>}
          {imageState === 'failed' && <View className="flex-1 items-center justify-center gap-3 p-5">
            <Ionicons name="image-outline" size={32} color={ink} accessible={false} />
            <Text accessibilityRole="alert" className="text-center font-sans text-sm text-danger">{t('arPhoto.errors.preview-failed')}</Text>
          </View>}
        </View>
        <View className="gap-3">
          {state.error && state.error !== 'preview-failed' && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(`arPhoto.errors.${state.error}`)}</Text>}
          {(operation || state.saved) && <View className="flex-row items-center gap-2 rounded-card bg-mint p-3" accessibilityLiveRegion="polite">
            {operation ? <Spinner size="sm" /> : <Ionicons name="checkmark-circle-outline" size={20} color={ink} accessible={false} />}
            <Text className="shrink font-sans text-sm font-ui-medium text-brand-strong">{t(`arPhoto.${operation ?? 'saved'}`)}</Text>
          </View>}
          <Button className="min-h-12 w-full" accessibilityLabel={t('arPhoto.save')} accessibilityState={{ busy: state.busy === 'save', disabled: busy || state.saved || unavailable }} isDisabled={busy || state.saved || unavailable} onPress={onSave}>
            <Ionicons name="download-outline" size={20} color={onAccent} accessible={false} /><Button.Label>{t('arPhoto.save')}</Button.Label>
          </Button>
          <Button variant="secondary" className="min-h-12 w-full" accessibilityLabel={t('arPhoto.share')} accessibilityState={{ busy: state.busy === 'share', disabled: busy || unavailable }} isDisabled={busy || unavailable} onPress={onShare}>
            <Ionicons name="share-outline" size={20} color={ink} accessible={false} /><Button.Label>{t('arPhoto.share')}</Button.Label>
          </Button>
          <Button variant="tertiary" className="min-h-12 w-full" accessibilityLabel={t('arPhoto.discard')} isDisabled={busy} onPress={onDiscard}>
            <Button.Label>{t('arPhoto.discard')}</Button.Label>
          </Button>
        </View>
        <View className="gap-2 pb-2">
          <Text className="font-sans text-xs text-muted">{t('arPhoto.about')}</Text>
          <Text className="font-sans text-xs text-muted">{t('arPhoto.temporary')}</Text>
        </View>
      </ScrollView>
    </SafePreview>
  </Modal>;
}
