import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useWalkingNavigation } from './use-walking-navigation';
const at = (east: number) => ({ latitude: 0, longitude: east / 111195.08 });
const coordinates = [at(0),at(100),at(200)];
let props: Parameters<typeof useWalkingNavigation>[0]; let current: ReturnType<typeof useWalkingNavigation>; let tree: ReactTestRenderer | undefined;
function Probe() { const value = useWalkingNavigation(props); React.useEffect(() => { current = value; }, [value]); return null; }
async function update() { await act(async () => { tree!.update(<Probe/>); }); }
async function fix(east: number, seconds = 3) { vi.setSystemTime(Date.now()+seconds*1000); props = { ...props, now: Date.now(), location: { ...props.location, position: at(east), positionTimestamp: Date.now(), watcherTimestamp: Date.now() } }; await update(); }
beforeEach(() => { Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); vi.useFakeTimers(); vi.setSystemTime(1800000000000);
 props = { coordinates, destination: at(200), running:true, usable:true, now:Date.now(), location:{position:at(0),accuracy:5,positionTimestamp:Date.now(),watcherTimestamp:Date.now(),watcherStatus:'ready'} };
 const original=console.error; vi.spyOn(console,'error').mockImplementation((...args:unknown[])=>{if(!String(args[0]).startsWith('react-test-renderer is deprecated'))original(...args);}); });
afterEach(async()=>{await act(async()=>tree?.unmount());tree=undefined;vi.useRealTimers();vi.restoreAllMocks();});
async function start() { await act(async()=>{tree=create(<Probe/>);}); expect(current.canStart).toBe(true); await act(async()=>current.start()); }
it('starts explicitly, trims locally, keeps raw position unchanged, and restores full preview on stop',async()=>{
 await act(async()=>{tree=create(<Probe/>);}); expect(current.started).toBe(false); expect(current.remainingCoordinates).toBe(coordinates);
 await act(async()=>current.start()); expect(current.started).toBe(true); expect(current.status).toBe('uncertain');
 await fix(5); await fix(15,6); expect(current.status).toBe('navigating'); expect(current.remainingMeters).toBeCloseTo(185,0);
 expect(props.location.position).toEqual(at(15)); expect(current.remainingCoordinates[0].longitude).toBeCloseTo(at(15).longitude,6);
 await act(async()=>current.stop()); expect(current.status).toBe('preview'); expect(current.remainingCoordinates).toBe(coordinates);
});
it.each(['running','usable'] as const)('immediately suspends on %s loss and corroborates new foreground fixes',async key=>{
 await start(); await fix(5); await fix(15,6); const remaining=current.remainingMeters;
 props={...props,[key]:false};await update();expect(current.status).toBe('uncertain');expect(current.remainingMeters).toBe(remaining);
 props={...props,[key]:true};await update();expect(current.status).toBe('uncertain');expect(current.remainingMeters).toBe(remaining);
 await fix(20);expect(current.status).toBe('uncertain');await fix(25);expect(current.status).toBe('navigating');
});
it('expires by the shared clock without location events and guards a delayed Start action',async()=>{
 await start();await fix(5);const remaining=current.remainingMeters;
 vi.setSystemTime(Date.now()+11000);props={...props,now:Date.now()};await update();expect(current.status).toBe('uncertain');expect(current.remainingMeters).toBe(remaining);
 await act(async()=>current.stop());expect(current.canStart).toBe(false);
 await fix(5);expect(current.canStart).toBe(true);const staleStart=current.start;vi.setSystemTime(Date.now()+11000);await act(async()=>staleStart());expect(current.started).toBe(false);
});
it('rejects inaccurate, unhealthy, one-shot-only and absent geometry at Start',async()=>{
 await act(async()=>{tree=create(<Probe/>);});
 for(const location of [{...props.location,accuracy:26},{...props.location,watcherStatus:'error'},{...props.location,watcherTimestamp:Date.now()-1}]){props={...props,location};await update();expect(current.canStart).toBe(false);await act(async()=>current.start());expect(current.started).toBe(false);}
 props={...props,coordinates:[]};await update();expect(current.canStart).toBe(false);
});
it('ends progress on arrival and retires an old session when its route is cleared/replaced',async()=>{
 props={...props,location:{...props.location,position:at(185)}};await start();await fix(190);await fix(195);expect(current.status).toBe('arrived');expect(current.remainingCoordinates).toEqual([]);
 await fix(180);expect(current.status).toBe('arrived');props={...props,coordinates:[]};await update();expect(current.started).toBe(false);expect(current.status).toBe('preview');
});

it('retains the same native polyline array when bookkeeping changes without progress',async()=>{
 await start();await fix(5);await fix(15,6);const line=current.remainingCoordinates;
 await fix(14);expect(current.remainingCoordinates).toBe(line);
 props={...props,running:false};await update();expect(current.remainingCoordinates).toBe(line);
});
