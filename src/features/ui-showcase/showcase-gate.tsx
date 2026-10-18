import type { PropsWithChildren } from 'react';
import ShowcaseScreen from './showcase-screen';

/** Explicit diagnostic mode: unavailable in release even if the flag is set. */
export function DevelopmentShowcase({ children }: PropsWithChildren) {
  return __DEV__ && process.env.EXPO_PUBLIC_UI_SHOWCASE === '1' ? <ShowcaseScreen /> : children;
}
