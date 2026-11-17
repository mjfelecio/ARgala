import { expect, it } from 'vitest';
import { BOOKMARK_PIN_MAX_AGE_MS } from '@/features/journal/bookmark-metadata';
import { savedMapMarkers } from './saved-map-markers';
it('renders only saved valid coordinates, without renewing their age', () => {
  const bookmarks = [{kind:'google' as const,id:'valid'}, {kind:'google' as const,id:'expired'}, {kind:'google' as const,id:'missing'}];
  const pin = { coordinates: { latitude: 1, longitude: 2 }, capturedAt: 1000 };
  const metadata = {'google:valid': {label:'My place',pin:{...pin,capturedAt:2000}},'google:expired':{pin}};
  const result = savedMapMarkers(bookmarks,metadata,1000+BOOKMARK_PIN_MAX_AGE_MS,null);
  expect(result.items.map(x=>x.reference.id)).toEqual(['valid']);
  expect(result.items[0].pin.capturedAt).toBe(2000);
});
it('bounds saved pins to the viewport and reports a deterministic overflow', () => {
  const bookmarks=Array.from({length:110},(_,i)=>({kind:'google' as const,id:String(i)}));
  const metadata=Object.fromEntries(bookmarks.map(ref=>[`google:${ref.id}`,{label:ref.id,pin:{coordinates:{latitude:1,longitude:2},capturedAt:1000}}]));
  const result=savedMapMarkers(bookmarks,metadata,2000,{latitude:1,longitude:2,latitudeDelta:1,longitudeDelta:1});
  expect(result.items).toHaveLength(100); expect(result.truncated).toBe(true);
  expect(savedMapMarkers(bookmarks,metadata,2000,{latitude:30,longitude:30,latitudeDelta:1,longitudeDelta:1}).items).toHaveLength(0);
});
