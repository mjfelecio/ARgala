import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/** Retained tab/stack screens must release their system-bar entry on blur. */
export function FocusedStatusBar({ style }: { style: 'dark' | 'light' }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} hidden={false} /> : null;
}
