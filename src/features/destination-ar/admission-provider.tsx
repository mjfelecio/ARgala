import { useEffect, useState, type PropsWithChildren } from 'react';
import { useGuestAccess } from '@/features/auth/guest-context';
import { useAuth } from '@/features/auth/provider';
import { ArAdmissionStore } from './admission-store';
import { AdmissionContext } from './admission-context';
function PrincipalOwner({ principalId, children }: PropsWithChildren<{ principalId: string }>) {
  const [store] = useState(() => new ArAdmissionStore(principalId));
  useEffect(() => store.retain(), [store]);
  return <AdmissionContext.Provider value={store}>{children}</AdmissionContext.Provider>;
}
export function DestinationArAdmissionProvider({ children }: PropsWithChildren) {
  const { session } = useAuth(); const guest=useGuestAccess(); const principalId = session?.user.id ?? (guest.enabled ? 'guest' : null);
  return principalId ? <PrincipalOwner key={principalId} principalId={principalId}>{children}</PrincipalOwner>
    : <AdmissionContext.Provider value={null}>{children}</AdmissionContext.Provider>;
}
