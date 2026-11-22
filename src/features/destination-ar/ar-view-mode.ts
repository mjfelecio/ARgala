export type ArView = 'details' | 'nearby';
export type ArViewPhase = 'exit' | 'enter';
export type ArViewState = Readonly<{
  view: ArView; target: ArView; phase: ArViewPhase | 'ready'; id: number; cue: number | null;
}>;
export const defaultArView: ArViewState = { view: 'details', target: 'details', phase: 'ready', id: 0, cue: null };
export const arViewDuration = { exit: 180, enter: 240 } as const;

export function requestView(current: ArViewState, target: ArView, reduced: boolean): ArViewState {
  if (current.phase !== 'ready' || current.view === target) return current;
  const id = current.id + 1;
  return reduced ? { view: target, target, phase: 'ready', id, cue: id }
    : { ...current, target, phase: 'exit', id, cue: null };
}

export function advanceView(current: ArViewState, id: number, phase: ArViewPhase): ArViewState {
  if (current.id !== id || current.phase !== phase) return current;
  return phase === 'exit' ? { ...current, view: current.target, phase: 'enter' } : { ...current, phase: 'ready', cue: id };
}

export function settleInterruptedView(current: ArViewState): ArViewState {
  return current.phase === 'ready' ? current : { ...current, view: current.target, phase: 'ready', cue: null };
}
