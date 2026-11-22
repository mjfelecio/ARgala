import { useState, type PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/provider';
import { useGuestAccess } from '@/features/auth/guest-context';
import { EntranceArrivalStore } from './entrance-arrival';
import { EntranceArrivalContext } from './entrance-arrival-context';

function PrincipalEntranceArrival({ children }: PropsWithChildren) {
  const [store] = useState(() => new EntranceArrivalStore());
  return <EntranceArrivalContext.Provider value={store}>{children}</EntranceArrivalContext.Provider>;
}

export function EntranceArrivalProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const guest = useGuestAccess();
  const principal = session ? `account:${session.user.id}` : guest.enabled ? 'guest' : null;
  return principal ? <PrincipalEntranceArrival key={principal}>{children}</PrincipalEntranceArrival> : children;
}
