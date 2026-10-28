import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { activationPolicy } from './ar-content';
import { DestinationProximity, type ArrivalInput } from './proximity';
import type { Destination } from './catalog';

/** Consumes the focused map/Directions location owner; never starts native work. */
export function useDestinationProximity(destination: Destination | null, input: ArrivalInput) {
  const policy = activationPolicy(destination);
  const id = destination?.id;
  const model = useMemo(() => id ? new DestinationProximity(id, policy) : null,
    // Catalog policy scalars define ownership; equivalent parsed objects are not a new selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, policy?.point.latitude, policy?.point.longitude, policy?.radiusMeters]);
  const latest = useRef(input);
  const alive = useRef(false);
  const currentModel = useRef(model);
  useLayoutEffect(() => { currentModel.current = model; latest.current = input; });
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [result, setResult] = useState(() => model?.snapshot() ?? null);
  const { running, watcherStatus, sample } = input;
  useEffect(() => {
    latest.current = { running, watcherStatus, sample };
    const update = () => setResult(model?.update(latest.current, Date.now()) ?? null);
    update();
    if (!running || !model) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [model, running, watcherStatus, sample]);
  const canEnter = useCallback(() => alive.current && currentModel.current === model && !!model?.update(latest.current, Date.now()).eligible, [model]);
  const dismiss = useCallback(() => { model?.dismiss(); setResult(model?.snapshot() ?? null); }, [model]);
  // Old selection presentation cannot survive the render before the ownership effect.
  return { state: result?.destinationId === id ? result : model?.snapshot() ?? null, canEnter, dismiss };
}
