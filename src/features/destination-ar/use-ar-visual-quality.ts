import { useEffect, useState } from 'react';
import { SchedulingQualityPolicy, type VisualQuality } from './visual-quality';

export function useArVisualQuality(running: boolean): VisualQuality {
  const [policy] = useState(() => new SchedulingQualityPolicy());
  const [quality, setQuality] = useState<VisualQuality>('standard');
  useEffect(() => {
    if (!running) { policy.pause(); return; }
    policy.observe(performance.now());
    const timer = setInterval(() => {
      const previous = policy.current; const next = policy.observe(performance.now());
      if (next !== previous) setQuality(next);
    }, 1000);
    return () => { clearInterval(timer); policy.pause(); };
  }, [running, policy]);
  return quality;
}
