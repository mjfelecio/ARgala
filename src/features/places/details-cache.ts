import { useCallback,useRef,useSyncExternalStore } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { placesService, type Place } from './service';
import { isCompleteDiscoveryPlace, isReusablePlaceData } from './selection';

/**
 * The Google adapter requests the same fields for Nearby and Details. A
 * normalized discovery response already contains every field we can display;
 * absent optional fields are legitimate omissions, not a reason to pay again.
 * Unknown handoffs still need explicit recovery. Keep this aligned with the
 * shared field mask in supabase/functions/_shared/places.ts.
 */
export function availablePlaceDetailsSnapshot(client: QueryClient, providerId: string | null, language: Language): { place: Place; updatedAt: number } | undefined {
  if (!providerId) return undefined;
  const full = client.getQueryState<Place>(['place-details', providerId, language]);
  if (full?.data?.providerId === providerId && isReusablePlaceData(full.dataUpdatedAt)) return { place: full.data, updatedAt: full.dataUpdatedAt };
  for (const query of client.getQueryCache().findAll({ queryKey: ['places'] })) {
    if (query.queryKey[2] !== language || !Array.isArray(query.state.data) || !isReusablePlaceData(query.state.dataUpdatedAt)) continue;
    const place = (query.state.data as Place[]).find(p => p.providerId === providerId && isCompleteDiscoveryPlace(p));
    if (place) return { place, updatedAt: query.state.dataUpdatedAt };
  }
  return undefined;
}

export function availablePlaceDetails(client: QueryClient, providerId: string | null, language: Language): Place | undefined {
  return availablePlaceDetailsSnapshot(client, providerId, language)?.place;
}

/** Disabled observers may seed from verified, same-language transient data. */
export function placeDetailsOptions(client: QueryClient, providerId: string | null, language: Language) {
  const cached = availablePlaceDetailsSnapshot(client, providerId, language);
  return {
    queryKey: ['place-details', providerId, language],
    queryFn: () => placesService.details(providerId!, language),
    initialData: cached?.place,
    // Copying Nearby fields must not restart their reuse window.
    initialDataUpdatedAt: cached?.updatedAt,
    gcTime: AR.nearbyReuseMs,
  };
}

/** Reactive display snapshot. Cache observation never grants request authority or renews its age. */
export function useAvailablePlaceDetailsSnapshot(client: QueryClient, providerId: string | null, language: Language) {
  const previous=useRef<ReturnType<typeof availablePlaceDetailsSnapshot>>(undefined);
  const getSnapshot=useCallback(()=>{
    const next=availablePlaceDetailsSnapshot(client,providerId,language);
    if(previous.current?.place===next?.place&&previous.current?.updatedAt===next?.updatedAt)return previous.current;
    previous.current=next;return next;
  },[client,providerId,language]);
  const subscribe=useCallback((onChange:()=>void)=>{
    let current=true;let timer:ReturnType<typeof setTimeout>|undefined;
    function scheduleExpiry(){
      clearTimeout(timer);const value=getSnapshot();if(!value)return;
      // Expiry must publish without another query/sensor event. Keep the source receipt time.
      timer=setTimeout(()=>{if(current){onChange();scheduleExpiry();}},Math.max(1,value.updatedAt+AR.nearbyReuseMs-Date.now()+1));
    }
    const unsubscribe=client.getQueryCache().subscribe(event=>{
      if(event.type!=='updated'&&event.type!=='added'&&event.type!=='removed')return;
      const key=event.query.queryKey;
      if((key[0]==='places'&&key[2]===language)||(key[0]==='place-details'&&key[1]===providerId&&key[2]===language)){
        onChange();scheduleExpiry();
      }
    });
    scheduleExpiry();return()=>{current=false;clearTimeout(timer);unsubscribe();};
  },[client,providerId,language,getSnapshot]);
  return useSyncExternalStore(subscribe,getSnapshot,getSnapshot);
}
