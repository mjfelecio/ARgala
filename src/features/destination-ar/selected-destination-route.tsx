import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice, Screen } from '@/ui/shared';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { LocationStatus } from '@/features/location/status';
import { approvedArContent } from '@/features/destinations/ar-content';
import { destinationName, getDestination, type FeaturedDestinationId } from '@/features/destinations/catalog';
import { useArAdmission, useAdmissionSnapshot, useAdmissionSource } from './admission-context';
import type { ArAdmissionStore, PreparedArEntry } from './admission-store';
import type { RingContent } from './ring-content';
import { isViroSpikeEnabled } from './dev-guard';
import { loadDraftRingContent } from './draft-content-loader';
import { DestinationArSessionExperience } from './destination-ar-session-screen';

export default function SelectedDestinationArRoute() {
  const store = useArAdmission(); const params = useLocalSearchParams();
  const id = getDestination(params.destinationId)?.id ?? null;
  const token = typeof params.entryToken === 'string' ? params.entryToken : null;
  return <ClaimedEntry key={`${store?.principalId ?? ''}:${id ?? ''}:${token ?? ''}`} store={store} id={id} token={token} />;
}
function Unavailable({ loading = false }: { loading?: boolean }) {
  const { t } = useTranslation();
  return <Screen><Notice busy={loading}>{t(loading ? 'common.loading' : 'arrival.entryUnavailable')}</Notice>
    <Action title={t('arrival.returnToMap')} onPress={() => router.dismissTo('/')} /></Screen>;
}
function ClaimedEntry({ store, id, token }: { store: ArAdmissionStore | null; id: FeaturedDestinationId | null; token: string | null }) {
  const snapshot = useAdmissionSnapshot(store);
  const [entry, setEntry] = useState<PreparedArEntry | null | undefined>(undefined);
  const claim = useRef<{ value: PreparedArEntry | null } | null>(null); const lifetime = useRef({ epoch: 0 });
  const [draft, setDraft] = useState<readonly RingContent[] | null>(null);
  useEffect(() => {
    let alive = true; const scope = lifetime.current; const epoch = ++scope.epoch;
    claim.current ??= { value: store && id ? store.take(token, id) : null };
    const value = claim.current.value;
    void Promise.resolve().then(() => { if (alive) setEntry(value); });
    return () => { alive = false; void Promise.resolve().then(() => { if (scope.epoch === epoch && value) store?.endEntry(value.identity.admissionId); }); };
  }, [store, id, token]);
  useEffect(() => {
    if (entry?.kind !== 'draft' || !isViroSpikeEnabled()) return;
    let alive = true;
    void loadDraftRingContent(entry.destination.id).then(value => { if (alive) setDraft(value ?? []); }).catch(() => { if (alive) setDraft([]); });
    return () => { alive = false; };
  }, [entry]);
  if (!entry) return <Unavailable loading={entry === undefined} />;
  if (!store || snapshot?.destinationId !== entry.identity.destinationId || entry.identity.provenance === 'development' && !isViroSpikeEnabled()) return <Unavailable />;
  let content: readonly RingContent[];
  if (entry.kind === 'draft') { if (!draft) return <Unavailable loading />; content = draft; }
  else {
    const ids = new Set(approvedArContent(entry.destination, entry.language).map(tile => tile.id));
    content = (entry.destination.ar?.tiles ?? []).filter(tile => ids.has(tile.id)).map(tile => ({ id: tile.id, role: tile.role, approved: { title: tile.title, body: tile.body } }));
  }
  return content.length ? <PreparedScene entry={entry} store={store} content={content} /> : <Unavailable />;
}
function PreparedScene({ entry, store, content }: { entry: PreparedArEntry; store: ArAdmissionStore; content: readonly RingContent[] }) {
  const { t } = useTranslation(); const active = useAppActive(); const focused = useIsFocused();
  const [established, setEstablished] = useState(false);
  const onEstablished = useCallback(() => setEstablished(true), []);
  const location = useDeviceLocation({ enabled: !established && !entry.simulated, heading: false, distanceIntervalMeters: 0 });
  useAdmissionSource(store, entry.destination.id, { running: active && focused && !established && !entry.simulated, watcherStatus: location.watcherStatus, sample: location.watcherSample }, false);
  const arrival = useAdmissionSnapshot(store);
  return <DestinationArSessionExperience identity={entry.identity} content={content} title={destinationName(entry.destination)}
    freshEligible={entry.authorizeMount} entryReady={entry.simulated || arrival?.destinationId === entry.destination.id && arrival.eligible}
    onEstablished={onEstablished} onExit={() => store.endEntry(entry.identity.admissionId)}
    onReturn={() => router.dismissTo({ pathname: '/', params: { featuredDestinationId: entry.destination.id } })}
    preflightNoticeKey="arrival.preflight" developmentNoticeKey={entry.simulated ? "arrival.simulatedLive" : "arrival.draftLive"} guidance={entry.simulated ? <Notice>{t("arrival.simulatedLive")}</Notice> : <View className="gap-2 px-4"><LocationStatus location={location} />
      <Text className="font-sans text-sm text-white">{t(`arrival.${arrival?.status ?? 'uncertain'}`)}</Text></View>} />;
}
