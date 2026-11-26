import type { ReactNode } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useCSSVariable, withUniwind } from 'uniwind';

const Photo = withUniwind(Image);

/** One photo crop and continuous title fade shared by destination pickers. */
export function DestinationPhotoCard({ id, source, failed, onImageError, testID, containImage = false, children }: {
  id: string; source?: ImageSourcePropType; failed: boolean; onImageError(): void; testID?: string; containImage?: boolean; children: ReactNode;
}) {
  const forest = useCSSVariable('--color-brand-strong') as string;
  const gradientId = `destination-fade-${id}`;
  return <View testID={testID} className="relative overflow-hidden rounded-card bg-brand-strong">
    {source && !failed && <Photo source={source} accessible={false}
      className={containImage ? 'absolute inset-x-0 top-3 h-52 w-full' : 'absolute inset-0 h-full w-full'}
      resizeMode={containImage ? 'contain' : 'cover'} onError={onImageError} />}
    <Svg pointerEvents="none" accessible={false} width="100%" height="100%" style={{ position: 'absolute' }}>
      <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={forest} stopOpacity="0" />
        <Stop offset="0.35" stopColor={forest} stopOpacity="0" />
        <Stop offset="0.6" stopColor={forest} stopOpacity="0.3" />
        <Stop offset="0.8" stopColor={forest} stopOpacity="0.85" />
        <Stop offset="1" stopColor={forest} stopOpacity="1" />
      </LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
    {children}
  </View>;
}
