import { useCSSVariable } from 'uniwind';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { brandGeometry } from './brand-geometry';

/** Decorative approved Journey paths, kept quiet behind the unchanged hero. */
export function JourneyMotif() {
  const [forest, seafoam] = useCSSVariable(['--color-logo-ink', '--color-logo-seafoam']) as string[];
  const [left, right, path, destination] = brandGeometry.journey;
  return <View className="absolute bottom-0 right-0 h-48 w-60 opacity-10" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 500 390" preserveAspectRatio="xMaxYMax meet">
      <Path d={left.d} fill={forest} />
      <Path d={right.d} fill={seafoam} />
      <Path d={path.d} fill={forest} />
      <Circle cx={destination.cx} cy={destination.cy} r={destination.r} fill={seafoam} />
    </Svg>
  </View>;
}
