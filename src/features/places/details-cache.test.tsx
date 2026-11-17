import React from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {QueryClient,QueryClientProvider,QueryObserver,notifyManager} from '@tanstack/react-query';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {queryClient} from '@/lib/query';
import {AR} from '@/config/limits';
import * as cache from './details-cache';
import * as selection from './selection';
import {placesService,type Place} from './service';
vi.mock('./service',()=>({placesService:{details:vi.fn()}}));
const require=createRequire(import.meta.url);
const babel=require('@babel/core') as {transformSync(source:string,options:object):{code:string}|null};
const compiledCache:Record<string,unknown>={};
const compiledCacheCode=babel.transformSync(readFileSync(new URL('./details-cache.ts',import.meta.url),'utf8'),{filename:'details-cache.ts',babelrc:false,configFile:false,presets:[require('@babel/preset-typescript')],plugins:[require('babel-plugin-react-compiler'),require('@babel/plugin-transform-modules-commonjs')]});
new Function('require','exports',compiledCacheCode!.code)((name:string)=>name==='react'?React:name==='@/config/limits'?{AR}:name==='./service'?{placesService}:name==='./selection'?selection:require(name),compiledCache);
type Snapshot=ReturnType<typeof cache.availablePlaceDetailsSnapshot>;
type ConsumerProps={client:QueryClient;id:string;language:'en'|'ja'|'ko'};
function compiledConsumer(readName:'availablePlaceDetailsSnapshot'|'useAvailablePlaceDetailsSnapshot'){
 const source=`import React from 'react';import {useQuery} from 'query';import {${readName},placeDetailsOptions} from 'cache';
 export function Consumer({client,id,language}){const query=useQuery({...placeDetailsOptions(client,id,language),enabled:false});const snapshot=${readName}(client,id,language);return React.createElement('output',{snapshot,status:query.status},snapshot?.place.name??'missing');}`;
 const result=babel.transformSync(source,{filename:'details-cache-consumer.js',babelrc:false,configFile:false,plugins:[require('babel-plugin-react-compiler'),require('@babel/plugin-transform-modules-commonjs')]});
 const exports:{Consumer?:React.ComponentType<ConsumerProps>}={};
 const testCache=compiledCache;
 new Function('require','exports',result!.code)((name:string)=>name==='react'?React:name==='query'?ReactQuery:name==='cache'?testCache:require(name),exports);
 return exports.Consumer!;
}
const LegacyConsumer=compiledConsumer('availablePlaceDetailsSnapshot');
const ReactiveConsumer=compiledConsumer('useAvailablePlaceDetailsSnapshot');
const place:Place={id:'google:reactive',provider:'google',providerId:'reactive',source:'discovery',name:'Resolved provider place',coordinates:{latitude:10,longitude:124},attributions:[]};
let tree:ReactTestRenderer|undefined;let client:QueryClient;let language:ConsumerProps['language'];const stops:(()=>void)[]=[];
const render=(Consumer=ReactiveConsumer)=><QueryClientProvider client={client}><Consumer client={client} id={place.providerId} language={language}/></QueryClientProvider>;
async function mount(Consumer=ReactiveConsumer){await act(async()=>{tree=create(render(Consumer));});}
const snapshot=()=>tree!.root.findByType('output').props.snapshot as Snapshot;
function retainSource(key:readonly unknown[]){const observer=new QueryObserver(client,{queryKey:key,enabled:false});stops.push(observer.subscribe(()=>{}));}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});client=new QueryClient({defaultOptions:queryClient.getDefaultOptions()});language='en';notifyManager.setScheduler(fn=>fn());vi.mocked(placesService.details).mockReset();});
afterEach(async()=>{await act(async()=>tree?.unmount());tree=undefined;stops.splice(0).forEach(stop=>stop());client.clear();notifyManager.setScheduler(fn=>setTimeout(fn,0));vi.useRealTimers();});
it('reproduces the installed compiler retaining an imperative missing snapshot after the real observer succeeds',async()=>{
 await mount(LegacyConsumer);expect(snapshot()).toBeUndefined();const pending=Promise.withResolvers<Place>();vi.mocked(placesService.details).mockReturnValueOnce(pending.promise);
 await act(async()=>{void client.fetchQuery({...cache.placeDetailsOptions(client,place.providerId,'en'),queryFn:()=>placesService.details(place.providerId,'en')});});
 await act(async()=>pending.resolve(place));expect(tree!.root.findByType('output').props.status).toBe('success');expect(cache.availablePlaceDetailsSnapshot(client,place.providerId,'en')?.place).toEqual(place);expect(snapshot()).toBeUndefined();
});
it('publishes asynchronous Details success to the compiler-transformed consumer without another request',async()=>{
 await mount();const pending=Promise.withResolvers<Place>();vi.mocked(placesService.details).mockReturnValueOnce(pending.promise);
 await act(async()=>{void client.fetchQuery({...cache.placeDetailsOptions(client,place.providerId,'en'),queryFn:()=>placesService.details(place.providerId,'en')});});
 await act(async()=>pending.resolve(place));expect(snapshot()?.place).toEqual(place);expect(placesService.details).toHaveBeenCalledOnce();
});
it('publishes a fresh Nearby source for the same selection while an existing Details entry stays expired',async()=>{
 const now=Date.now();const staleAt=now-AR.nearbyReuseMs-1000;const key=['places',{radiusMeters:1000},'en'];retainSource(key);
 client.setQueryData(['place-details',place.providerId,'en'],{...place,name:'Expired details'},{updatedAt:staleAt});await mount();expect(snapshot()).toBeUndefined();
 await act(async()=>{client.setQueryData(key,[place],{updatedAt:now-1000});});expect(snapshot()).toEqual({place,updatedAt:now-1000});
 expect(client.getQueryState(['place-details',place.providerId,'en'])?.dataUpdatedAt).toBe(staleAt);expect(client.getQueryState(key)?.dataUpdatedAt).toBe(now-1000);expect(placesService.details).not.toHaveBeenCalled();
});
it('removes reset or authentication-cleared display data and reacts to a later cache result without fetching',async()=>{
 await mount();await act(async()=>{client.setQueryData(['place-details',place.providerId,'en'],place);});expect(snapshot()?.place).toEqual(place);
 await act(async()=>client.resetQueries({queryKey:['place-details']}));expect(snapshot()).toBeUndefined();expect(placesService.details).not.toHaveBeenCalled();
 await act(async()=>{client.setQueryData(['place-details',place.providerId,'en'],place);});expect(snapshot()?.place).toEqual(place);
 await act(async()=>client.clear());expect(snapshot()).toBeUndefined();expect(placesService.details).not.toHaveBeenCalled();
});
it('keeps equivalent reads stable, changes language without fetching, and expires without a cache event or age renewal',async()=>{
 vi.useFakeTimers();const timestamp=Date.now();const key=['places',{radiusMeters:1000},'en'];retainSource(key);client.setQueryData(key,[place],{updatedAt:timestamp});await mount();const first=snapshot();
 await act(async()=>client.invalidateQueries({queryKey:['places']}));expect(snapshot()).toBe(first);
 language='ja';await act(async()=>tree!.update(render()));expect(snapshot()).toBeUndefined();
 const jaKey=['places',{radiusMeters:1000},'ja'];retainSource(jaKey);await act(async()=>{client.setQueryData(jaKey,[{...place,name:'Japanese provider name'}],{updatedAt:timestamp});});expect(snapshot()?.place.name).toBe('Japanese provider name');
 await act(async()=>{await vi.advanceTimersByTimeAsync(AR.nearbyReuseMs+1);});expect(snapshot()).toBeUndefined();expect(client.getQueryState(jaKey)?.dataUpdatedAt).toBe(timestamp);expect(placesService.details).not.toHaveBeenCalled();
});
