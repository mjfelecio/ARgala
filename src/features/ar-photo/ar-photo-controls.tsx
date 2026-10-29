import { useLayoutEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { ArPhotoController } from './controller';
import { createPhotoService } from './service';
import type { NativeCapture, PhotoSnapshot } from './types';
export type { NativePhotoResult } from './types';
export type ArPhotoControlsProps = { capture: NativeCapture | null; sessionKey: string; running: boolean };
const StyledImage = withUniwind(Image);
const SafePreview = withUniwind(SafeAreaView);

/** The caller includes complete logical identity and native-frame generation in
 * sessionKey, and supplies running only for live/exploring focused foreground AR.
 * Removing this child retires old callbacks before another owner can capture.
 */
export function ArPhotoControls({ capture, sessionKey, running }: ArPhotoControlsProps) {
  return running && capture ? <PhotoOwner key={sessionKey} capture={capture} /> : null;
}

function PhotoOwner({ capture }: { capture: NativeCapture }) {
  const { t } = useTranslation();
  const [state, setState] = useState<PhotoSnapshot>({ photoUri: null, saved: false, busy: null, error: null });
  const latestCapture = useRef(capture);
  const [controller] = useState(() => new ArPhotoController(createPhotoService(), setState));
  useLayoutEffect(() => { latestCapture.current = capture; }, [capture]);
  useLayoutEffect(() => {
    controller.activate(fileName => latestCapture.current(fileName));
    return () => controller.retire();
  }, [controller]);
  const error = state.error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(`arPhoto.errors.${state.error}`)}</Text> : null;
  const busy = state.busy !== null;
  return <View testID="ar-photo-controls" pointerEvents="box-none" className="shrink gap-2">
    <Button variant="secondary" accessibilityLabel={t('arPhoto.capture')} isDisabled={busy || state.photoUri !== null} onPress={() => void controller.capture()}>
      <Button.Label>{t(state.busy === 'capture' ? 'arPhoto.capturing' : 'arPhoto.capture')}</Button.Label>
    </Button>
    {!state.photoUri && error}
    {state.photoUri && <Modal visible onRequestClose={() => controller.discard()}>
      <SafePreview className="flex-1 bg-surface" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="grow gap-4 p-4">
          <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('arPhoto.preview')}</Text>
          <Text className="font-sans text-sm text-muted">{t('arPhoto.about')}</Text>
          {state.error !== 'preview-failed' && <StyledImage source={{ uri: state.photoUri }} resizeMode="contain" className="h-80 w-full rounded-card" accessibilityLabel={t('arPhoto.image')} onError={() => controller.previewFailed()} />}
          {error}
          {state.saved && <Text accessibilityLiveRegion="polite" className="font-sans text-base text-foreground">{t('arPhoto.saved')}</Text>}
          <View className="flex-row flex-wrap gap-3">
            <Button accessibilityLabel={t('arPhoto.save')} isDisabled={busy || state.saved || state.error === 'preview-failed'} onPress={() => void controller.save()}>
              <Button.Label>{t(state.busy === 'save' ? 'arPhoto.saving' : 'arPhoto.save')}</Button.Label>
            </Button>
            <Button variant="secondary" accessibilityLabel={t('arPhoto.share')} isDisabled={busy || state.error === 'preview-failed'} onPress={() => void controller.share()}>
              <Button.Label>{t(state.busy === 'share' ? 'arPhoto.sharing' : 'arPhoto.share')}</Button.Label>
            </Button>
            <Button variant="tertiary" accessibilityLabel={t('arPhoto.discard')} isDisabled={busy} onPress={() => controller.discard()}>
              <Button.Label>{t('arPhoto.discard')}</Button.Label>
            </Button>
          </View>
          <Text className="font-sans text-sm text-muted">{t('arPhoto.temporary')}</Text>
        </ScrollView>
      </SafePreview>
    </Modal>}
  </View>;
}
