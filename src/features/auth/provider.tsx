import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { queryClient } from '@/lib/query';

type AuthState = { session: Session | null; loading: boolean; error: 'auth.restoreFailed' | null; retry: () => void };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<Omit<AuthState, 'retry'>>({ session: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const client = getSupabase();
    let alive = true;
    let revision = 0;
    let previousUser: string | undefined;
    const update = (session: Session | null) => {
      if (!alive) return;
      if (session?.user.id !== previousUser || !session) queryClient.clear();
      previousUser = session?.user.id;
      setState({ session, loading: false, error: null });
    };
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      revision += 1;
      update(session);
    });
    const initialRevision = revision;
    void client.auth.getSession().then(({ data: result, error }) => {
      if (!alive || revision !== initialRevision) return;
      if (error) setState({ session: null, loading: false, error: 'auth.restoreFailed' });
      else update(result.session);
    }).catch(() => {
      if (alive && revision === initialRevision) setState({ session: null, loading: false, error: 'auth.restoreFailed' });
    });
    const refresh = (status: string) => {
      if (status === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const listener = AppState.addEventListener('change', refresh);
    return () => { alive = false; data.subscription.unsubscribe(); listener.remove(); client.auth.stopAutoRefresh(); };
  }, [attempt]);
  return <AuthContext.Provider value={{ ...state, retry: () => { setState({ session: null, loading: true, error: null }); setAttempt((value) => value + 1); } }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing.');
  return context;
}
