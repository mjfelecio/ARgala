import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArPhotoController } from './controller';
import { ArPhotoPreview } from './ar-photo-preview';
import { createPhotoService } from './service';
import type { NativeCapture, PhotoSnapshot } from './types';
export type { NativePhotoResult } from './types';
export type ArPhotoControlsProps = { capture: NativeCapture | null; sessionKey: string; running: boolean; compact?: boolean; leadingAction?: ReactNode };

/** The caller includes complete logical identity and native-frame generation in
 * sessionKey, and supplies running only for live/exploring focused foreground AR.
 * Removing this child retires old callbacks before another owner can capture.
 */
export function ArPhotoControls({ capture, sessionKey, running, compact = false, leadingAction }: ArPhotoControlsProps) {
  return running && capture ? <PhotoOwner key={sessionKey} capture={capture} compact={compact} leadingAction={leadingAction} /> : <>{leadingAction}</>;
}

function PhotoOwner({ capture, compact, leadingAction }: { capture: NativeCapture; compact: boolean; leadingAction?: ReactNode }) {
  const { t } = useTranslation();
  const utilityInk = useThemeColor('foreground');
  const [state, setState] = useState<PhotoSnapshot>({ photoUri: null, saved: false, busy: null, error: null });
  const latestCapture = useRef(capture);
  const [controller] = useState(() => new ArPhotoController(createPhotoService(), setState));
  useLayoutEffect(() => { latestCapture.current = capture; }, [capture]);
  useLayoutEffect(() => {
    controller.activate(fileName => latestCapture.current(fileName));
    return () => controller.retire();
  }, [controller]);
  const busy = state.busy !== null;
  return <View testID="ar-photo-controls" pointerEvents="box-none" className="w-full gap-2">
    <View testID="ar-photo-actions" pointerEvents="box-none" className="flex-row flex-wrap items-center justify-center gap-2">
    {leadingAction}
    <Button variant="secondary" isIconOnly={compact} className={compact ? 'size-12 p-0' : 'min-h-12'} accessibilityLabel={t('arPhoto.capture')} accessibilityState={{ busy, disabled: busy || state.photoUri !== null }} isDisabled={busy || state.photoUri !== null} onPress={() => void controller.capture()}>
      <View className="size-6 items-center justify-center" accessible={false}>
        {state.busy === 'capture' ? <Spinner size="sm" color={utilityInk} /> : <Ionicons name="camera-outline" size={22} color={utilityInk} />}
      </View>
      {!compact && <Button.Label>{t('arPhoto.capture')}</Button.Label>}
    </Button>
    </View>
    {state.busy === 'capture' && !state.photoUri && <Text testID="ar-photo-processing" accessibilityLiveRegion="polite" className="w-full px-2 text-center font-sans text-xs text-white">{t('arPhoto.preparing')}</Text>}
    {!state.photoUri && state.error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="w-full px-2 text-center font-sans text-sm text-white">{t(`arPhoto.errors.${state.error}`)}</Text>}
    {state.photoUri && <ArPhotoPreview key={state.photoUri} state={{ ...state, photoUri: state.photoUri }} onSave={() => void controller.save()} onShare={() => void controller.share()} onDiscard={() => controller.discard()} onPreviewFailed={() => controller.previewFailed()} />}
  </View>;
}
