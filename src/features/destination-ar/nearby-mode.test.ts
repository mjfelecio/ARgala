import { describe, expect, it, vi } from 'vitest';
import type { Place } from '@/features/places/service';
import { advanceView, defaultArView, requestView, settleInterruptedView } from './ar-view-mode';
import { AR, DISCOVERY } from '@/config/limits';
import { CameraNorthAlignment, layoutNearbyCards, matchCameraHeading, nearbySearchOrigin, NearbyScan } from './nearby-mode';

const center = { latitude: 11, longitude: 124 };
const north = { position: [0, 2, 0], forward: [0, 0, -1] } as const;
const place = (id: string, latitude: number, longitude: number): Place => ({
  id, providerId: id, provider: 'google', source: 'discovery', name: id,
  coordinates: { latitude, longitude }, attributions: [],
});

describe('AR view switch', () => {
  it('exits fully before entering and retires duplicate or interrupted callbacks', () => {
    const exit = requestView(defaultArView, 'nearby', false);
    expect(exit).toMatchObject({ view: 'details', target: 'nearby', phase: 'exit' });
    expect(requestView(exit, 'details', false)).toBe(exit);
    const enter = advanceView(exit, exit.id, 'exit');
    expect(enter).toMatchObject({ view: 'nearby', phase: 'enter' });
    expect(advanceView(enter, exit.id, 'exit')).toBe(enter);
    const ready = advanceView(enter, enter.id, 'enter');
    expect(ready).toMatchObject({ view: 'nearby', phase: 'ready', cue: enter.id });
    const reverse = requestView(ready, 'details', false);
    const interrupted = settleInterruptedView(reverse);
    expect(interrupted).toMatchObject({ view: 'details', phase: 'ready', cue: null });
    expect(advanceView(interrupted, reverse.id, 'exit')).toBe(interrupted);
  });

  it('swaps immediately with reduced motion', () => {
    expect(requestView(defaultArView, 'nearby', true)).toMatchObject({ view: 'nearby', phase: 'ready', cue: 1 });
  });
});

describe('Nearby Places', () => {
  it('checks continuous-fix freshness and accuracy independently of the latest displayed location', () => {
    expect(nearbySearchOrigin({ position: center, timestamp: 100, accuracy: 10 }, 'ready', 100)).toEqual(center);
    expect(nearbySearchOrigin({ position: center, timestamp: 100, accuracy: 10 }, 'error', 101)).toBeNull();
    expect(nearbySearchOrigin({ position: center, timestamp: 100, accuracy: 10 }, 'ready', 101 + AR.positionMaxAgeMs)).toBeNull();
    expect(nearbySearchOrigin({ position: center, timestamp: 100, accuracy: null }, 'ready', 100)).toBeNull();
  });

  it('retains only the current explicit scan, deduplicates duplicate taps and expires by original time', async () => {
    let now = 100;
    let receive!: (results: Place[]) => void;
    const service = vi.fn(() => new Promise<Place[]>(resolve => { receive = resolve; }));
    const scan = new NearbyScan(service, () => now);
    const scope = { location: center, language: 'en' as const };
    expect(service).not.toHaveBeenCalled();
    const pending = scan.scan(scope);
    await scan.scan(scope);
    expect(service).toHaveBeenCalledExactlyOnceWith({ center, language: 'en', radiusMeters: DISCOVERY.radiusMeters });
    scan.retire();
    receive([place('old', 11.001, 124)]);
    await pending;
    expect(scan.getSnapshot()).toMatchObject({ busy: false, result: null });
    const current = scan.scan(scope);
    receive([place('north', 11.001, 124), place('north', 11.001, 124)]);
    await current;
    expect(scan.getSnapshot().result?.places).toHaveLength(1);
    now += AR.nearbyReuseMs - 1;
    scan.expire();
    expect(scan.getSnapshot().result?.receivedAt).toBe(100);
    now++;
    scan.expire();
    expect(scan.getSnapshot().result).toBeNull();
    expect(service).toHaveBeenCalledTimes(2);
  });

  it('lays out the same bearing in separate vertical lanes and aligns an east-facing camera', () => {
    const cards = layoutNearbyCards([place('north', 11.001, 124), place('north2', 11.002, 124), place('east', 11, 124.001)], center);
    expect(cards[0].position[2]).toBeLessThan(0);
    expect(cards.find(card => card.place.id === 'north2')?.position[1]).not.toBe(cards[0].position[1]);
    expect(cards.find(card => card.place.id === 'east')?.position[0]).toBeGreaterThan(0);
    expect(matchCameraHeading({ position: [...north.position], forward: [...north.forward] }, 90)).toBe(-90);
    expect(matchCameraHeading({ position: [...north.position], forward: [0, 1, 0] }, 90)).toBeNull();
  });

  it('gives an explicitly selected result a card even when bearings are crowded', () => {
    const places = Array.from({ length: 20 }, (_, index) => place(String(index), 11.001 + index * 0.0001, 124));
    expect(layoutNearbyCards(places, center).some(card => card.place.id === '19')).toBe(false);
    const cards = layoutNearbyCards(places, center, '19');
    expect(cards[0]).toMatchObject({ place: { id: '19' }, position: [0, 0, -3.2] });
  });


  it('waits for a stable sequence of camera heading pairs and hides cards on disagreement or expiry', () => {
    const alignment = new CameraNorthAlignment();
    expect(alignment.observe(92, 20, 100)).toBeNull();
    expect(alignment.observe(92, 45, 200)).toBeNull();
    expect(alignment.observe(91, 45, 300)).toBeNull();
    expect(alignment.observe(90, 46, 400)).toBe(90);
    expect(alignment.observe(92, 62, 500)).toBeCloseTo(90.36);
    expect(alignment.observe(135, 100, 600)).toBeNull();
    expect(alignment.get(700)).toBeNull();
    alignment.observe(92, 40, 800);
    alignment.observe(92, 40, 900);
    expect(alignment.observe(92, 40, 1000)).toBe(92);
    expect(alignment.get(2200)).toBeNull();
  });

});
