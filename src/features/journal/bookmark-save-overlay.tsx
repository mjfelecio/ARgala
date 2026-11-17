import {useLayoutEffect,useRef,type RefObject} from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { Dialog } from 'heroui-native/dialog';
import { I18nextProvider,useTranslation } from 'react-i18next';
import type { BookmarkMetadata } from './bookmark-metadata';
import { BookmarkEditor } from './bookmark-editor';

const SafeArea=withUniwind(SafeAreaView);
/** The portal owns form/keyboard layout; the map's compact Save column never grows. */
export function BookmarkSaveOverlay({placeName,pending,onPendingChange,isCurrent,save,onClose}:{placeName?:string;pending:RefObject<boolean>;onPendingChange(pending:boolean):void;isCurrent():boolean;save(metadata:BookmarkMetadata):Promise<boolean>;onClose():void}){
 const {t,i18n}=useTranslation();const {height}=useWindowDimensions();const live=useRef(false);
 useLayoutEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const current=()=>live.current&&isCurrent();
 function close(){if(current()&&!pending.current)onClose();}
 return <Dialog isOpen onOpenChange={open=>{if(!open)close();}}>
  <Dialog.Portal className="p-0!"><I18nextProvider i18n={i18n}>
   <Dialog.Overlay />
   <Dialog.Content isSwipeable={false} accessibilityViewIsModal className="w-full overflow-hidden rounded-none bg-page p-0!" style={{height}}>
    <SafeArea className="flex-1" edges={['top','bottom','left','right']}>
     <KeyboardAvoidingView behavior="height" className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="grow px-6 py-6" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
       <View className="mx-auto w-full max-w-xl gap-3">
        <Dialog.Title className="font-sans text-title font-ui-bold text-brand-strong">{t('journal.save')}</Dialog.Title>
        {placeName&&<Text className="font-sans text-base text-muted">{placeName}</Text>}
        <BookmarkEditor onPendingChange={onPendingChange} isCurrent={current} save={save} onClose={close}/>
       </View>
      </ScrollView>
     </KeyboardAvoidingView>
    </SafeArea>
   </Dialog.Content>
  </I18nextProvider></Dialog.Portal>
 </Dialog>;
}
