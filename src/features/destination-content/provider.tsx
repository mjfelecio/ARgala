import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/provider';
import { useAppActive } from '@/lib/use-app-active';
import { environment } from '@/config/env';
import { DestinationContentContext, type DestinationContentState } from './context';
import { ContentRepository } from './repository';
import { contentManifestSchema, type ContentManifest } from './model';
import { ContentError, contentService, type ContentAccount, type ContentService } from './service';

const defaultRepository = new ContentRepository(AsyncStorage, environment.success ? environment.data.url : 'https://unconfigured.invalid');
type Request = { account: ContentAccount; signal: AbortSignal };
type Props = PropsWithChildren<{ repository?: ContentRepository; service?: ContentService }>;

/** Device-wide approved public content; account identity authorizes downloads only, never a cache namespace. */
export function DestinationContentProvider({ children, repository = defaultRepository, service = contentService }: Props) {
  const { session } = useAuth(); const active = useAppActive();
  const principal = session?.user.id ?? null;
  const [manifest, setManifest] = useState<ContentManifest | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<{ controller: AbortController; principal: string } | null>(null);
  const checking = pending !== null && pending.principal === principal && active && !pending.controller.signal.aborted;
  const [error, setError] = useState<DestinationContentState['error']>(null);
  const [message, setMessage] = useState<DestinationContentState['message']>('content.bundled');
  const latest = useRef({ principal, active, token: session?.access_token, ready });
  useLayoutEffect(() => { latest.current = { principal, active, token: session?.access_token, ready }; }, [principal, active, session?.access_token, ready]);
  const lifetime = useRef({ generation: 0, job: null as AbortController | null });
  const { mutateAsync, reset } = useMutation({
    mutationKey: ['destination-content-check'], gcTime: 0, retry: false, networkMode: 'always',
    mutationFn: ({ account, signal }: Request) => service(account, signal),
  });
  useEffect(() => {
    let alive = true;
    void repository.open().then(value => {
      if (!alive) return;
      setManifest(value); setMessage(value ? 'content.cached' : 'content.bundled'); setReady(true);
    }).catch(() => { if (alive) { setError('content.loadFailed'); setReady(true); } });
    return () => { alive = false; };
  }, [repository]);
  useEffect(() => {
    reset(); const scope = lifetime.current;
    return () => { scope.generation++; scope.job?.abort(); scope.job = null; };
  }, [principal, active, reset]);
  const checkUpdates = useCallback(async () => {
    const owner = latest.current;
    if (!owner.principal || !owner.token) { setError('content.authRequired'); return; }
    const scope = lifetime.current;
    if (!owner.active || !owner.ready || scope.job) return;
    const controller = new AbortController(); const epoch = scope.generation;
    scope.job = controller; setPending({ controller, principal: owner.principal }); setError(null);
    const current = () => !controller.signal.aborted && scope.generation === epoch && latest.current.principal === owner.principal && latest.current.active;
    try {
      const response = await mutateAsync({ account: { principalId: owner.principal, accessToken: owner.token }, signal: controller.signal });
      if (!current()) return;
      if (response === null) { setMessage('content.noUpdates'); return; }
      const parsed = contentManifestSchema.parse(response);
      let installed: ContentManifest;
      try { installed = await repository.install(parsed, current); }
      catch { throw new ContentError('content.saveFailed'); }
      if (current()) { setManifest(installed); setMessage('content.current'); }
    } catch (failure) {
      if (current()) setError(failure instanceof ContentError ? failure.code : 'content.failed');
    } finally {
      if (scope.job === controller) { scope.job = null; setPending(null); reset(); }
    }
  }, [mutateAsync, repository, reset]);
  return <DestinationContentContext.Provider value={{ manifest, ready, checking, authenticated: !!session?.access_token, canCheck: ready && active && !!session?.access_token && !checking, message, error, checkUpdates }}>{children}</DestinationContentContext.Provider>;
}
