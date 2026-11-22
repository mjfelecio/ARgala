import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { useThemeColor } from 'heroui-native/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, Keyframe, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { isViroSpikeEnabled } from '@/features/destination-ar/dev-guard';
import type { Language } from '../../../supabase/functions/_shared/contracts';

const medallionMs = 160;
const confettiMs = 280;
const medallionEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  68: { opacity: 1, transform: [{ scale: 1.05 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(medallionMs);
const particles = [
  { x: -75, y: -25, angle: -60, color: 'bg-seafoam' },
  { x: -56, y: -54, angle: -40, color: 'bg-accent' },
  { x: -30, y: -66, angle: 40, color: 'bg-brand-strong' },
  { x: -63, y: 34, angle: -80, color: 'bg-brand-strong' },
  { x: 75, y: -22, angle: 70, color: 'bg-accent' },
  { x: 54, y: -55, angle: 50, color: 'bg-seafoam' },
  { x: 32, y: -64, angle: -40, color: 'bg-accent' },
  { x: 63, y: 36, angle: 90, color: 'bg-brand-strong' },
].map(({ x, y, angle, color }) => ({
  x, color,
  animation: new Keyframe({
    0: { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] },
    30: { opacity: 1 },
    100: { opacity: 0, transform: [{ translateX: x }, { translateY: y }, { rotate: `${angle}deg` }] },
  }).duration(confettiMs),
}));

type ClaimUnlock = (language: Language) => boolean;

type UnlockOfferProps = { destinationTitle: string; language: Language; claimUnlock: ClaimUnlock; onLaunch(): void };

export function ArrivalUnlock({ eligible, destinationTitle, ...offer }: Omit<UnlockOfferProps, 'destinationTitle'> & {
  eligible: boolean; destinationTitle?: string;
}) {
  return eligible && destinationTitle ? <UnlockOffer destinationTitle={destinationTitle} {...offer} /> : null;
}

function UnlockOffer({ destinationTitle, language, claimUnlock, onLaunch }: UnlockOfferProps) {
  const [openFor, setOpenFor] = useState<ClaimUnlock | null>(null);
  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => {
      if (current && claimUnlock(language)) setOpenFor(() => claimUnlock);
    });
    return () => { current = false; };
  }, [claimUnlock, language]);
  if (openFor !== claimUnlock) return null;
  return <UnlockDialog destinationTitle={destinationTitle} onLaunch={onLaunch} onDismiss={() => setOpenFor(null)} />;
}

export function ArrivalUnlockPreview({ destinationTitle, language }: { destinationTitle: string; language: Language }) {
  const [open, setOpen] = useState(false);
  if (!__DEV__ || !isViroSpikeEnabled()) return null;
  const copy = {
    en: { action: 'Preview AR unlock celebration', dismiss: 'Close preview' },
    ja: { action: 'AR解放のお祝い演出を試す', dismiss: 'プレビューを閉じる' },
    ko: { action: 'AR 잠금 해제 축하 효과 미리 보기', dismiss: '미리 보기 닫기' },
  }[language];
  return <>
    <Button testID="arrival-unlock-preview" variant="outline" className="h-auto min-h-12 w-full py-3"
      accessibilityLabel={copy.action} onPress={() => setOpen(true)}>
      <Button.Label className="shrink text-center">{copy.action}</Button.Label>
    </Button>
    {open && <UnlockDialog destinationTitle={destinationTitle} dismissLabel={copy.dismiss} onDismiss={() => setOpen(false)} />}
  </>;
}

function UnlockDialog({ destinationTitle, onLaunch, onDismiss, dismissLabel }: { destinationTitle: string; onLaunch?(): void; onDismiss(): void; dismissLabel?: string }) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'medallion' | 'confetti' | 'ready'>('medallion');
  const active = useRef(false);
  useLayoutEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    if (reducedMotion || phase === 'ready') return;
    const medallion = phase === 'medallion';
    const timer = setTimeout(() => setPhase(medallion ? 'confetti' : 'ready'), medallion ? medallionMs : confettiMs);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);
  const canStart = reducedMotion || phase === 'ready';
  function close(launch = false) {
    if (!active.current || (launch && !canStart)) return;
    active.current = false;
    onDismiss();
    if (launch) onLaunch?.();
  }
  return <Dialog isOpen animation="disable-all" onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content isSwipeable={false} accessibilityViewIsModal className="mx-auto w-full max-w-sm overflow-hidden rounded-page bg-surface p-0!">
        <ScrollView style={{ maxHeight: Math.max(1, height - insets.top - insets.bottom - 48) }} contentContainerClassName="gap-4 p-6">
          <View className="h-28 items-center justify-center" accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
            <Animated.View testID="arrival-unlock-medallion" entering={reducedMotion ? undefined : medallionEntrance}
              className="size-20 items-center justify-center rounded-pill border border-outline bg-mint">
              <Ionicons name="cube-outline" color={accent} size={38} accessible={false} />
            </Animated.View>
            {!reducedMotion && phase === 'confetti' && <View testID="arrival-unlock-confetti" className="absolute inset-0 items-center justify-center">
              {particles.map(({ x, animation, color }) => <Animated.View key={x} entering={animation} className={`absolute h-3 w-1.5 rounded-pill ${color}`} />)}
            </View>}
          </View>
          <View className="gap-2">
            <Dialog.Title className="text-center font-sans text-title font-ui-bold text-brand-strong">{t('arrival.unlockTitle')}</Dialog.Title>
            <Text className="text-center font-sans text-base text-muted">{destinationTitle}</Text>
          </View>
          {onLaunch && <View className="min-h-12">
            {canStart && <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(medallionMs)}>
              <Button accessibilityLabel={t('arrival.unlockStart')} onPress={() => close(true)}>
                <Button.Label className="shrink text-center">{t('arrival.unlockStart')}</Button.Label>
              </Button>
            </Animated.View>}
          </View>}
          <Button variant="ghost" accessibilityLabel={dismissLabel ?? t('arrival.dismiss')} onPress={() => close()}>
            <Button.Label className="shrink text-center">{dismissLabel ?? t('arrival.dismiss')}</Button.Label>
          </Button>
        </ScrollView>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog>;
}
