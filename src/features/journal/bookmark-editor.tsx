import { useLayoutEffect,useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { Button } from 'heroui-native/button';
import { BOOKMARK_TEXT_MAX_LENGTH, type BookmarkMetadata } from './bookmark-metadata';

export function BookmarkEditor({initial,save,onClose,onPendingChange,isCurrent=()=>true}:{initial?:BookmarkMetadata;save(metadata:BookmarkMetadata):Promise<boolean>;onClose():void;onPendingChange?(pending:boolean):void;isCurrent?():boolean}) {
  const {t}=useTranslation();const [label,setLabel]=useState(initial?.label??'');const [note,setNote]=useState(initial?.note??'');
  const [busy,setBusy]=useState(false);const pending=useRef(false);const live=useRef(false);
  useLayoutEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  const canInteract=()=>live.current&&isCurrent();const [error,setError]=useState<'journalCleanup.labelRequired'|'journal.saveFailed'|null>(null);
  async function submit(){
    if(!canInteract()||pending.current)return;if(!label.trim()){setError('journalCleanup.labelRequired');return;}
    pending.current=true;onPendingChange?.(true);setBusy(true);setError(null);
    try {const saved=await save({label:label.trim(),...(note.trim()?{note:note.trim()}:{})});if(canInteract()){if(saved){pending.current=false;onPendingChange?.(false);onClose();}else setError('journal.saveFailed');}}
    catch{if(canInteract())setError('journal.saveFailed');}finally{pending.current=false;onPendingChange?.(false);if(canInteract())setBusy(false);}
  }
  return <View className="w-full gap-3 py-3">
    <Text className="font-sans text-sm text-muted">{t('journalCleanup.labelGuidance')}</Text>
    <TextField isDisabled={busy} isInvalid={error==='journalCleanup.labelRequired'}>
      <Label><Label.Text className="font-sans text-sm font-ui-semibold">{t('journalCleanup.label')}</Label.Text></Label>
      <Input value={label} onChangeText={setLabel} maxLength={BOOKMARK_TEXT_MAX_LENGTH} accessibilityLabel={t('journalCleanup.label')} className="min-h-14 rounded-input bg-surface px-4 font-sans text-base" />
    </TextField>
    <TextField isDisabled={busy}>
      <Label><Label.Text className="font-sans text-sm font-ui-semibold">{t('journalCleanup.note')}</Label.Text></Label>
      <Input value={note} onChangeText={setNote} maxLength={BOOKMARK_TEXT_MAX_LENGTH} accessibilityLabel={t('journalCleanup.note')} multiline className="min-h-14 rounded-input bg-surface px-4 font-sans text-base" />
    </TextField>
    {error&&<Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(error)}</Text>}
    <View className="flex-row flex-wrap gap-2">
      <Button isDisabled={busy} accessibilityState={{busy,disabled:busy}} accessibilityLabel={t('journalCleanup.confirm')} onPress={submit}><Button.Label>{t('journalCleanup.confirm')}</Button.Label></Button>
      <Button variant="ghost" isDisabled={busy} accessibilityLabel={t('journalCleanup.cancel')} onPress={()=>{if(canInteract()&&!pending.current)onClose();}}><Button.Label>{t('journalCleanup.cancel')}</Button.Label></Button>
    </View>
  </View>;
}
