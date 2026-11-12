import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useAuth } from '@/features/auth/provider';
import { Action, Notice, Screen } from '@/ui/shared';
import { isViroSpikeEnabled } from './dev-guard';
import { loadDevelopmentSession } from './development-session-loader';
export { isViroSpikeEnabled } from './dev-guard';

function back() { if (router.canGoBack()) router.back(); else router.navigate('/'); }
export function ViroRingLaunch() {
  const { t } = useTranslation();
  return isViroSpikeEnabled() ? <Button variant="secondary" className="mx-4 mb-2" accessibilityLabel={t('destinationRing.title')} onPress={() => router.push('/viro-ring')}>
    <Button.Label>{t('destinationRing.title')}</Button.Label>
  </Button> : null;
}
export function ViroRingRoute() {
  const { t } = useTranslation(); const { session } = useAuth();
  // Neither a URL nor an environment flag can enable this in a release build.
  if (!isViroSpikeEnabled() || !session?.user.id) return <Screen><Notice>{t('destinationAr.unavailable')}</Notice>
    <Action title={t('common.back')} onPress={back} /></Screen>;
  return <DevelopmentSessionLoader key={session.user.id} />;
}

/** Keep the loading owner mounted. On the tested Android renderer the lazy
 * import resolved while its first-navigation Suspense fallback stayed visible.
 * Explicit completion also lets us retire a timeout/retry/principal's late work.
 */
function DevelopmentSessionLoader() {
  const { t } = useTranslation(); const [attempt, setAttempt] = useState(0);
  const [Session, setSession] = useState<Awaited<ReturnType<typeof loadDevelopmentSession>>>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => { current = false; setFailed(true); }, 20000);
    void loadDevelopmentSession().then(component => {
      if (!current) return;
      clearTimeout(timer);
      if (component) setSession(() => component); else setFailed(true);
    }).catch(() => { if (current) { clearTimeout(timer); setFailed(true); } });
    return () => { current = false; clearTimeout(timer); };
  }, [attempt]);
  if (Session) return <Session />;
  return <Screen><Notice busy={!failed}>{t(failed ? 'destinationRing.previewLoadFailed' : 'common.loading')}</Notice>
    {failed && <Action title={t('common.retry')} onPress={() => { setFailed(false); setAttempt(value => value + 1); }} />}
    <Action title={t('common.back')} onPress={back} />
  </Screen>;
}
