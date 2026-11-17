import Svg, { Circle, Path } from 'react-native-svg';

/** A closed passport: the globe belongs to the cover, with a single book spine. */
export function PassportIcon({ color, size = 42 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" accessible={false}>
    <Path d="M13 5h24a3 3 0 0 1 3 3v32a3 3 0 0 1-3 3H13a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M14 5v38M9 36h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={27} cy={22} r={8} stroke={color} strokeWidth={1.7} />
    <Path d="M19 22h16M27 14c-5 4-5 12 0 16 5-4 5-12 0-16ZM22 35h10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>;
}
