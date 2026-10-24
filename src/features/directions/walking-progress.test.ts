import { describe, expect, it } from 'vitest';
import { distanceMeters, type Coordinate } from '@/features/location/geo';
import { advanceWalkingProgress, createWalkingProgress, interruptWalkingProgress, prepareWalkingRoute, remainingWalkingCoordinates, type WalkingSample } from './walking-progress';
// Local deterministic metre grid near the equator; assertions allow spherical conversion tolerance.
const at = (east: number, north = 0): Coordinate => ({ longitude: east / 111195.08, latitude: north / 111195.08 });
const straight = () => prepareWalkingRoute([at(0), at(100), at(200)], at(200))!;
const sample = (east: number, time: number, north = 0, accuracy = 5): WalkingSample => ({ position: at(east, north), accuracy, timestamp: time, watcherTimestamp: time, ready: true });
function trace(points: [number, number, number?, number?][], route = straight()) {
  let state = createWalkingProgress();
  for (const [east, time, north, accuracy] of points) state = advanceWalkingProgress(route, state, sample(east, time, north, accuracy), time);
  return state;
}
describe('walking progress from authoritative GPS', () => {
  it('prepares immutable geometry with correct coordinate order and modular Turf meter properties', () => {
    const coordinates = [at(0), at(100), at(200)]; const copy = structuredClone(coordinates);
    const route = prepareWalkingRoute(coordinates, at(200))!;
    expect(route.totalMeters).toBeCloseTo(200, 2);
    coordinates[0].longitude = 99;
    expect(route.coordinates).toEqual(copy);
    expect(prepareWalkingRoute([at(0), at(0)], at(0))).toBeNull();
    expect(prepareWalkingRoute([at(0), { latitude: NaN, longitude: 0 }], at(0))).toBeNull();
    expect(prepareWalkingRoute([], at(0))).toBeNull();
  });
  it('corroborates acquisition then progressively trims walking without mutating original coordinates', () => {
    const route = straight(); let state = createWalkingProgress();
    state = advanceWalkingProgress(route, state, sample(0, 1000), 1000);
    expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(0);
    state = advanceWalkingProgress(route, state, sample(5, 4000), 4000);
    expect(state.status).toBe('navigating');
    state = advanceWalkingProgress(route, state, sample(15, 10000), 10000);
    expect(state.progressMeters).toBeCloseTo(15, 1);
    const remaining = remainingWalkingCoordinates(route, state);
    expect(distanceMeters(remaining[0], at(15))).toBeLessThan(.1);
    expect(remaining.at(-1)).toEqual(at(200)); expect(route.coordinates[0]).toEqual(at(0));
  });
  it('holds stationary drift and small backward noise; genuine backward walking never advances progress', () => {
    expect(trace([[0,1000],[0,4000],[3,7000],[-2,10000],[4,13000]]).progressMeters).toBe(0);
    const forward = [[0,1000],[0,4000],[10,10000],[20,16000]] as [number,number][];
    const state = trace([...forward,[18,19000],[12,23000],[4,28000],[15,35000]]);
    expect(state.status).toBe('navigating'); expect(state.progressMeters).toBeCloseTo(20,1);
  });
  it.each([null, 26, 100, -1, NaN])('does not advance or claim arrival with degraded accuracy %s', accuracy => {
    const route = straight(); const previous = trace([[0,1000],[0,4000],[10,10000]]);
    const state = advanceWalkingProgress(route, previous, { ...sample(200,13000), accuracy },13000);
    expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(previous.progressMeters);
  });
  it('rejects stale/future timestamps, missing watcher health, one-shot-only fixes and duplicate corroboration', () => {
    const route = straight(); const first = advanceWalkingProgress(route,createWalkingProgress(),sample(0,1000),1000);
    expect(advanceWalkingProgress(route,first,sample(0,1000),1000)).toBe(first);
    for (const bad of [sample(20,1000), sample(20,14001), { ...sample(20,13000), ready:false }, { ...sample(20,13000), watcherTimestamp:12000 }]) {
      const state = advanceWalkingProgress(route,first,bad,13000);
      expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(0);
    }
  });
  it('rejects an isolated large spike and recovers without accepting it as a movement anchor', () => {
    const route = straight(); let state = trace([[0,1000],[0,4000],[10,10000]]);
    state = advanceWalkingProgress(route,state,sample(150,13000),13000);
    expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBeCloseTo(10,1);
    state = advanceWalkingProgress(route,state,sample(15,16000),16000);
    state = advanceWalkingProgress(route,state,sample(20,19000),19000);
    expect(state.status).toBe('navigating'); expect(state.progressMeters).toBeCloseTo(20,1);
  });
  it('does not irreversibly trim an isolated spike inside a moderate accuracy uncertainty budget', () => {
    const route=straight(); let state=trace([[0,1000,0,25],[0,4000,0,25]]);
    state=advanceWalkingProgress(route,state,sample(40,7000,0,25),7000);
    expect(state.status).toBe('uncertain');expect(state.progressMeters).toBe(0);
    state=advanceWalkingProgress(route,state,sample(0,10000,0,25),10000);
    expect(state.progressMeters).toBe(0);
    state=advanceWalkingProgress(route,state,sample(40,13000,0,25),13000);
    state=advanceWalkingProgress(route,state,sample(43,16000,0,25),16000);
    expect(state.status).toBe('navigating');expect(state.progressMeters).toBeGreaterThan(25);
  });
  it('requires three reliable off-route readings and corroborates return without forced snapping', () => {
    const route = straight(); let state = trace([[0,1000],[0,4000]]);
    for (const [north,time] of [[15,14000],[30,24000],[45,34000],[48,37000]]) state = advanceWalkingProgress(route,state,sample(0,time,north),time);
    expect(state.status).toBe('off-route'); expect(state.progressMeters).toBe(0);
    state = advanceWalkingProgress(route,state,sample(10,67000),67000);
    expect(state.status).toBe('uncertain');
    state = advanceWalkingProgress(route,state,sample(12,70000),70000);
    expect(state.status).toBe('navigating'); expect(state.progressMeters).toBeCloseTo(12,1);
  });
  it('handles a sharp turn using original arc length', () => {
    const route = prepareWalkingRoute([at(0),at(30),at(30,100)],at(30,100))!;
    const state = trace([[0,1000],[0,4000],[20,17000],[30,24000],[30,34000,15]], route);
    expect(state.status).toBe('navigating'); expect(state.progressMeters).toBeCloseTo(45,1);
  });
  it('pauses at self intersections and overlapping distant route portions instead of jumping forward', () => {
    for (const coords of [[at(-50),at(50),at(50,50),at(0,-50),at(0,50)], [at(0),at(100),at(0),at(100)]]) {
      const route = prepareWalkingRoute(coords,coords.at(-1)!)!;
      const state = trace([[0,1000],[0,4000]],route);
      expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(0);
    }
  });
  it('allows a unique initial join but blocks a later large along-route leap even after a long gap', () => {
    expect(trace([[120,1000],[122,4000]]).progressMeters).toBeCloseTo(122,1);
    const route = straight(); const previous = trace([[0,1000],[0,4000],[10,10000]]);
    const state = advanceWalkingProgress(route,previous,sample(150,100000),100000);
    expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(previous.progressMeters);
  });
  it('bounds along-route progress by walking speed even where a detour ends nearby', () => {
    const route = prepareWalkingRoute([at(0),at(20),at(20,20),at(0,20)],at(0,20))!;
    let state = trace([[0,1000],[0,4000]],route);
    state = advanceWalkingProgress(route,state,sample(0,7000,20,8),7000);
    expect(state.status).toBe('uncertain'); expect(state.progressMeters).toBe(0);
  });
  it('requires repeated accurate raw destination proximity and ends progress only on confirmed arrival', () => {
    const route = straight(); let state = trace([[170,1000],[172,4000],[185,13000],[192,19000]]);
    expect(state.status).not.toBe('arrived');
    state = advanceWalkingProgress(route,state,sample(195,22000),22000);
    expect(state.status).toBe('arrived'); expect(remainingWalkingCoordinates(route,state)).toEqual([]);
    expect(advanceWalkingProgress(route,state,sample(180,25000),25000)).toBe(state);
    const farDestination = prepareWalkingRoute([at(0),at(100)],at(140))!;
    expect(trace([[90,1000],[92,4000],[98,8000]],farDestination).status).not.toBe('arrived');
  });
  it('interrupts foreground ownership, retains historical progress and demands new corroboration on resume', () => {
    const route = straight(); const previous = trace([[0,1000],[0,4000],[20,16000]]);
    const paused = interruptWalkingProgress(previous);
    expect(paused.status).toBe('uncertain'); expect(paused.progressMeters).toBe(previous.progressMeters);
    const one = advanceWalkingProgress(route,paused,sample(25,20000),20000);
    expect(one.status).toBe('uncertain'); expect(one.progressMeters).toBe(previous.progressMeters);
    const resumed = advanceWalkingProgress(route,one,sample(30,23000),23000);
    expect(resumed.status).toBe('navigating'); expect(resumed.progressMeters).toBeCloseTo(30,1);
  });
});
