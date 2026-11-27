import { Button } from 'heroui-native/button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { ARRIVAL } from '@/config/limits';
import { isViroSpikeEnabled } from '@/features/destination-ar/dev-guard';
import type { EntranceSnapshot } from './entrance-arrival';
import type { ArrivalEvidence } from './proximity';

type Props = {
  destinationId: string;
  read(): ArrivalEvidence | null;
  contentReady: boolean;
  entrance: EntranceSnapshot | null;
};

export function ArrivalFieldPanel(props: Props) {
  return isViroSpikeEnabled() ? <FieldReadout key={props.destinationId} {...props} /> : null;
}

function FieldReadout({ destinationId, read, contentReady, entrance }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState<ArrivalEvidence | null>(null);
  useEffect(() => {
    if (!open) return;
    const update = () => setEvidence(read());
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [open, read]);

  const evidenceRows = evidence ? {
    decision: t(`arrivalField.reasons.${evidence.decision}`) + (evidence.repeated ? t('arrivalField.repeated') : ''),
    fix: t('arrivalField.fix', { status: t(`arrivalField.status.${evidence.watcherStatus}`),
      age: evidence.ageMs === null ? '—' : (evidence.ageMs / 1000).toFixed(1), accuracy: meters(evidence.accuracy) }),
    boundary: t('arrivalField.boundary', { status: evidence.contained === null ? '—' : t(evidence.contained ? 'arrivalField.inside' : 'arrivalField.outside'),
      distance: meters(evidence.boundaryMeters) }),
    span: t('arrivalField.span', { count: evidence.count, required: ARRIVAL.requiredSamples,
      seconds: (evidence.spanMs / 1000).toFixed(1), requiredSeconds: ARRIVAL.corroborationMs / 1000 }),
  } : { waiting: t('arrivalField.waiting') };
  return <View className="gap-2">
    <Button variant="outline" className="min-h-12" accessibilityState={{ expanded: open }} onPress={() => {
      setEvidence(open ? null : read());
      setOpen(!open);
    }}><Button.Label>{t('arrivalField.title')}</Button.Label></Button>
    {open && <View className="gap-1 rounded-input bg-mint p-3">
      <Text accessibilityRole="header" className="font-sans font-ui-semibold text-brand-strong">{t('arrivalField.heading', { destinationId })}</Text>
      {Object.entries(evidenceRows).map(([label, row]) =>
        <Text key={label} className="font-sans text-sm text-foreground">{row}</Text>)}
      <Text className="font-sans text-sm text-foreground">{t('arrivalField.content', {
        status: t(contentReady ? 'arrivalField.status.ready' : 'arrivalField.status.unavailable'),
      })}</Text>
      <Text className="font-sans text-sm text-foreground">{t('arrivalField.entrance', {
        status: t(`arrivalField.status.${entrance?.status ?? 'unavailable'}`), distance: meters(entrance?.distanceMeters ?? null),
      })}</Text>
    </View>}
  </View>;
}

function meters(value: number | null) {
  return value !== null && Number.isFinite(value) ? `${Math.round(value)} m` : '—';
}
