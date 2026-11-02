export type IntroVariant = 'full' | 'return' | 'reduced' | 'none';
/** Pure presentation decision. Tracking-ready remains the session's authority. */
export function introVariant({ ready, established, seen, reduced }: { ready: boolean; established: boolean; seen: boolean; reduced: boolean }): IntroVariant {
  if (!ready || established) return 'none';
  return reduced ? 'reduced' : seen ? 'return' : 'full';
}
export const introDuration = (variant: IntroVariant) => variant === 'full' ? 3000 : variant === 'return' ? 650 : variant === 'reduced' ? 180 : 0;
