import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
function subscribe(onChange: () => void) {
  const listener = AppState.addEventListener('change', onChange);
  return () => listener.remove();
}
const getSnapshot = () => AppState.currentState === 'active';
export function useAppActive() {
  // Recheck the native snapshot when subscribing, including changes missed after render.
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
