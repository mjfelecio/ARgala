import { schoolPresentationHistoryScope } from '@/features/destinations/history-content';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/features/auth/provider';
import { useGuestAccess } from '@/features/auth/guest-context';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { destinationIds, destinationName, getDestination, localizedContent, type DestinationId } from '@/features/destinations/catalog';
import { DestinationPhotoCard } from '@/features/destinations/destination-photo-card';
import { PassportIcon } from '@/features/journal/passport-icon';
import { StatusRow } from '@/ui/status-row';
import { loadExhibitScene } from './exhibit-loader';
import { featuredStoryContent } from './featured-story-content';
import { withExhibitVisitorContent } from './exhibit-visitor-content';
import { DestinationArSessionExperience } from './session-experience';
import { ShowcaseMemory } from './showcase-memory';
import type { SessionIdentity } from './session';

const SafePage = withUniwind(SafeAreaView);
const Photo = withUniwind(Image);
function leave() { if (router.canGoBack()) router.back(); else router.navigate('/profile'); }


export default function ShowcaseScreen() {
  const { session } = useAuth(); const guest = useGuestAccess(); const { t } = useTranslation();
  const principal = session?.user.id ?? (guest.enabled ? 'guest' : null);
  return principal ? <ShowcaseOwner key={principal} principalId={principal} /> : <ShowcasePage title={t('arShowcase.title')} onBack={leave}><StatusRow>{t('arShowcase.unavailable')}</StatusRow></ShowcasePage>;
}
function ShowcasePage({ title, onBack, children }: { title: string; onBack(): void; children: React.ReactNode }) {
  const { t } = useTranslation(); const accent = useThemeColor('accent');
  return <SafePage className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('common.back')} onPress={onBack}><Ionicons name="arrow-back" size={24} color={accent} accessible={false} /></Button>
      <Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-brand-strong">{title}</Text>
    </View>
    <ScrollView className="flex-1" contentContainerClassName="gap-5 px-4 pb-8">{children}</ScrollView>
  </SafePage>;
}
function ShowcaseOwner({ principalId }: { principalId: string }) {
  const { t } = useTranslation(); const { language } = useSettings(); const focused = useIsFocused(); const scopeId = useId(); const seafoam = useCSSVariable('--color-seafoam') as string;
  const [memory] = useState(() => new ShowcaseMemory()); const snapshot = useSyncExternalStore(memory.subscribe, memory.getSnapshot, memory.getSnapshot);
  const [destinationId, setDestinationId] = useState<DestinationId | null>(null);
  const alive = useRef(false); useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; memory.reset(); }; }, [memory]);
  const ownerAlive = useCallback(() => alive.current, []);
  useEffect(() => {
    if (!focused || !destinationId) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setDestinationId(null); return true; });
    return () => subscription.remove();
  }, [focused, destinationId]);
  function back() { if (destinationId) setDestinationId(null); else leave(); }
  if (destinationId) return <ShowcaseDestination key={`${snapshot.generation}:${destinationId}`} destinationId={destinationId} principalId={principalId}
    scopeId={scopeId} memory={memory} generation={snapshot.generation} seen={snapshot.introductions.includes(destinationId)} stamped={snapshot.stamps.includes(destinationId)}
    ownerAlive={ownerAlive} onReturn={() => setDestinationId(null)} />;
  return <ShowcasePage title={t('arShowcase.title')} onBack={back}>
    <Text className="font-sans text-base text-foreground">{t('arShowcase.intro')}</Text>
    <View className="gap-3 rounded-card bg-brand-strong p-5">
      <View className="flex-row items-center gap-3"><Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-white">{t('arShowcase.passportTitle')}</Text><PassportIcon color={seafoam} /></View>
      <Text accessibilityLiveRegion="polite" className="font-sans text-base font-ui-semibold text-white">{t('arShowcase.passportCount', { count: snapshot.stamps.length, total: destinationIds.length })}</Text>
      <View className="flex-row gap-1" accessibilityRole="progressbar" accessibilityLabel={t('arShowcase.passportTitle')} accessibilityValue={{ min: 0, max: destinationIds.length, now: snapshot.stamps.length }}>
        {destinationIds.map(id => <View key={id} className={`h-2 flex-1 rounded-pill ${snapshot.stamps.includes(id) ? 'bg-seafoam' : 'bg-white/25'}`} />)}
      </View>
      <Text className="font-sans text-sm text-white">{t('arShowcase.passportHint')}</Text>
      <Button variant="secondary" className="self-start" accessibilityLabel={t('arShowcase.reset')} onPress={() => memory.reset()}><Button.Label>{t('arShowcase.reset')}</Button.Label></Button>
    </View>
    <Text accessibilityRole="header" className="font-sans text-section font-ui-bold text-brand-strong">{t('arShowcase.choose')}</Text>
    {destinationIds.map(id => <ShowcaseDestinationCard key={id} destinationId={id} name={destinationName(getDestination(id)!, language)} stamped={snapshot.stamps.includes(id)} onPress={() => setDestinationId(id)} />)}
  </ShowcasePage>;
}
function ShowcaseDestinationCard({ destinationId, name, stamped, onPress }: { destinationId: DestinationId; name: string; stamped: boolean; onPress(): void }) {
  const { t } = useTranslation(); const [failed, setFailed] = useState(false);
  const destination = getDestination(destinationId)!; const cover = destination.media?.find(photo => photo.id === destination.coverMediaId) ?? destination.media?.[0];
  return <DestinationPhotoCard containImage={cover?.kind === 'emblem'} id={`showcase-${destinationId}`} source={cover?.source} failed={failed} onImageError={() => setFailed(true)}>
    <Pressable className="active:opacity-80" accessibilityRole="button" accessibilityLabel={name} accessibilityHint={t('arShowcase.openHint')} onPress={onPress}>
      <View className="min-h-56" />
      <View className="min-h-24 flex-row items-center gap-4 p-5">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-sans text-section font-ui-semibold text-white">{name}</Text>
          {stamped && <Text className="font-sans text-sm text-white">{t('arShowcase.visited')}</Text>}
        </View>
        <Ionicons name={stamped ? 'checkmark-circle' : 'chevron-forward'} size={24} color="white" accessible={false} />
      </View>
    </Pressable>
  </DestinationPhotoCard>;
}
function ShowcasePreparation({ destinationId, stamped }: { destinationId: DestinationId; stamped: boolean }) {
  const { t } = useTranslation(); const { language } = useSettings(); const [failed, setFailed] = useState(false);
  const destination = getDestination(destinationId)!; const cover = destination.media?.find(photo => photo.id === destination.coverMediaId) ?? destination.media?.[0];
  return <View className="gap-4">
    {cover && !failed && <Photo source={cover.source} className="h-52 w-full rounded-card" resizeMode={cover.kind === 'emblem' ? 'contain' : 'cover'} accessible accessibilityLabel={localizedContent(cover.alt, language)?.value} onError={() => setFailed(true)} />}
    {cover && <Text className="font-sans text-xs text-muted">{t('destinationRing.imageCredit', { credit: cover.credit })}</Text>}
    <View className="gap-2 rounded-card bg-mint p-4"><Text className="font-sans text-card font-ui-semibold text-brand-strong">{t('arShowcase.ready')}</Text><Text className="font-sans text-sm text-foreground">{t('arShowcase.readyHint')}</Text></View>
    {stamped && <Text className="font-sans text-sm text-muted">{t('arShowcase.visited')}</Text>}
  </View>;
}
function ShowcaseDestination({ destinationId, principalId, scopeId, memory, generation, seen, stamped, ownerAlive, onReturn }: {
  destinationId: DestinationId; principalId: string; scopeId: string; memory: ShowcaseMemory; generation: number; seen: boolean; stamped: boolean; ownerAlive(): boolean; onReturn(): void;
}) {
  const { t } = useTranslation(); const { language } = useSettings(); const focused = useIsFocused(); const active = useAppActive();
  const [Scene, setScene] = useState<Awaited<ReturnType<typeof loadExhibitScene>>>(null); const [failed, setFailed] = useState(false); const [attempt, setAttempt] = useState(0);
  const ownership = useRef({ alive: false, running: false });
  useLayoutEffect(() => { ownership.current = { alive: true, running: focused && active }; return () => { ownership.current.alive = false; ownership.current.running = false; }; }, [focused, active]);
  useEffect(() => {
    if (!focused || !active || Scene || failed) return;
    let current = true; const timer = setTimeout(() => { current = false; setFailed(true); }, 20000);
    void loadExhibitScene(destinationId).then(value => { if (current) { clearTimeout(timer); if (value) setScene(() => value); else setFailed(true); } }).catch(() => { if (current) { clearTimeout(timer); setFailed(true); } });
    return () => { current = false; clearTimeout(timer); };
  }, [focused, active, Scene, failed, attempt, destinationId]);
  const identity = useMemo<SessionIdentity>(() => ({ admissionId: `showcase:${scopeId}:${generation}:${destinationId}`, destinationId, principalId, provenance: 'showcase' }), [scopeId, generation, destinationId, principalId]);
  const freshEligible = useCallback(() => ownerAlive() && ownership.current.alive && ownership.current.running && memory.getSnapshot().generation === generation, [ownerAlive, memory, generation]);
  const sceneLoader = useCallback(async () => Scene!, [Scene]);
  const onEstablished = useCallback(() => { if (freshEligible()) memory.recordEstablished(destinationId, generation); }, [freshEligible, memory, destinationId, generation]);
  const introductionMemory = useMemo(() => ({ seen, complete: () => { if (freshEligible()) memory.completeIntroduction(destinationId, generation); } }), [seen, freshEligible, memory, destinationId, generation]);
  const content = useMemo(() => withExhibitVisitorContent(getDestination(destinationId)!, featuredStoryContent(destinationId), schoolPresentationHistoryScope), [destinationId]);
  if (!Scene) return <ShowcasePage title={destinationName(getDestination(destinationId)!, language)} onBack={onReturn}>
    <ShowcasePreparation destinationId={destinationId} stamped={stamped} />
    <StatusRow busy={!failed}>{t(failed ? 'arShowcase.loadFailed' : 'arShowcase.loading')}</StatusRow>
    {failed && <Button accessibilityLabel={t('common.retry')} onPress={() => { setFailed(false); setAttempt(value => value + 1); }}><Button.Label>{t('common.retry')}</Button.Label></Button>}
  </ShowcasePage>;
  return <DestinationArSessionExperience identity={identity} freshEligible={freshEligible} sceneLoader={sceneLoader} content={content}
    galleryMediaIds={getDestination(destinationId)!.media?.map(photo => photo.id)} title={destinationName(getDestination(destinationId)!, language)}
    onEstablished={onEstablished} onReturn={onReturn} introductionMemory={introductionMemory} preflightNoticeKey="arShowcase.preflight"
    preparation={<ShowcasePreparation destinationId={destinationId} stamped={stamped} />} />;
}
