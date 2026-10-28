import { useRef,useState } from 'react';
import { Text } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useJournal } from './context';
import { bookmarkKey,type Bookmark } from './model';
export function SavePlaceAction({reference}:{reference:Bookmark}){
 const journal=useJournal();const {t}=useTranslation();const pending=useRef(false);const [busy,setBusy]=useState(false);
 if(!journal)return null;
 const saved=journal.state.bookmarks.some(x=>bookmarkKey(x)===bookmarkKey(reference));const label=t(saved?'journal.remove':'journal.save');
 return <Button variant="secondary" accessibilityLabel={label} isDisabled={!journal.ready||busy} accessibilityState={{busy,disabled:!journal.ready||busy}} onPress={async()=>{
  if(pending.current||!journal.ready)return;pending.current=true;setBusy(true);try{await journal.save(reference,!saved);}finally{pending.current=false;setBusy(false);}
 }}><Button.Label>{label}</Button.Label></Button>;
}
export function JournalFeedback({onRetrySave}:{onRetrySave?:()=>void}={}){const journal=useJournal();const {t}=useTranslation();if(!journal)return null;
 return <>{!journal.ready&&!journal.error&&<Text className="font-sans text-sm text-muted">{t('common.loading')}</Text>}{journal.error&&<Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(journal.error)}</Text>}{journal.error==='journal.saveFailed'&&onRetrySave&&<Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={onRetrySave}><Button.Label>{t('common.retry')}</Button.Label></Button>}{journal.error==='journal.loadFailed'&&<Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={journal.retry}><Button.Label>{t('common.retry')}</Button.Label></Button>}</>;
}
