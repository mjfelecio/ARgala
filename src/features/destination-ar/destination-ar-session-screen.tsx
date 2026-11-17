import { useEffect, useId, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/provider';
import { Action, Notice, Screen } from '@/ui/shared';
import { isViroSpikeEnabled } from './dev-guard';
import { loadDevelopmentSystemAudio } from './development-audio-loader';
import { loadDevelopmentGalleryContent } from './development-gallery-loader';
import { developmentRingContent, type RingContent } from './development-ring-content';
import { loadRingScene } from './ring-loader';
import type { AudioManifest } from './system-audio';
import type { SessionIdentity } from './session';
import { DestinationArSessionExperience as Experience, type SessionExperienceProps } from './session-experience';

/** Hidden diagnostics alone own sample defaults and synthetic audio. */
export function DestinationArSessionExperience(props: Omit<SessionExperienceProps, 'content' | 'sceneLoader'> & Partial<Pick<SessionExperienceProps, 'content' | 'sceneLoader'>>) {
  return <Experience {...props} content={props.content ?? developmentRingContent} sceneLoader={props.sceneLoader ?? loadRingScene} />;
}
export default function DevelopmentSessionRoute() {
  const { session } = useAuth(); const { t } = useTranslation(); const scopeId = useId();
  const [selected, setSelected] = useState(false);
  const principalId = session?.user.id;
  const identity = useMemo<SessionIdentity>(() => ({ admissionId: `development-${scopeId}`, destinationId: 'development-aclc', principalId: principalId ?? '', provenance: 'development' }), [principalId, scopeId]);
  if (!principalId || !isViroSpikeEnabled()) return <Screen><Notice>{t('destinationAr.unavailable')}</Notice></Screen>;
  if (selected) return <DevelopmentGallerySession key={principalId} identity={identity} />;
  return <Screen><Notice>{t('destinationRing.prototype')}</Notice>
    <Action title={t('destinationRing.title')} onPress={() => setSelected(true)} />
    <Action title={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }} />
  </Screen>;
}

function DevelopmentGallerySession({ identity }: { identity: SessionIdentity }) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [content, setContent] = useState<readonly RingContent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [audioManifest, setAudioManifest] = useState<AudioManifest | undefined>();
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => { current = false; setFailed(true); }, 20000);
    void loadDevelopmentSystemAudio().then(value => { if (current) setAudioManifest(value ?? undefined); }).catch(() => { /* Optional audio never blocks AR entry. */ });
    void loadDevelopmentGalleryContent().then(value => {
      if (!current) return;
      clearTimeout(timer);
      if (value) setContent(value); else setFailed(true);
    }).catch(() => { if (current) { clearTimeout(timer); setFailed(true); } });
    return () => { current = false; clearTimeout(timer); };
  }, [attempt]);
  if (content) return <DestinationArSessionExperience identity={identity} freshEligible={isViroSpikeEnabled} content={content} audioManifest={audioManifest} />;
  return <Screen><Notice>{t(failed ? 'destinationRing.contentFailed' : 'common.loading')}</Notice>
    {failed && <Action title={t('common.retry')} onPress={() => { setFailed(false); setAttempt(value => value + 1); }} />}
  </Screen>;
}
