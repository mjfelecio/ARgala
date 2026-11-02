import { useCSSVariable } from 'uniwind';
import Svg, { G, Path } from 'react-native-svg';
import { brandGeometry } from './brand-geometry';

type Props = {
  variant?: 'primary' | 'horizontal' | 'mark';
  width: number;
  /** Use inverse crossbar/lettering on dark forest backgrounds. */
  inverse?: boolean;
  decorative?: boolean;
};

/** Outlined wordmark preserves the kit's lettering; app copy keeps Jakarta Sans. */
export function BrandLogo({ variant = 'primary', width, inverse = false, decorative = false }: Props) {
  const [seafoam, forest, ivory] = useCSSVariable(['--color-logo-seafoam', '--color-logo-ink', '--color-logo-ivory']) as string[];
  const ink = inverse ? ivory : forest;
  const lockup = variant === 'mark' ? null : brandGeometry.lockups[variant];
  // Add one rounded foot's clear space around the standalone arch. Lockups
  // already include the master's clear space and retain their exact viewBox.
  const viewBox = lockup?.viewBox ?? '-80 -80 760 680';
  const [, , canvasWidth, canvasHeight] = viewBox.split(' ').map(Number);
  return <Svg width={width} height={width * canvasHeight / canvasWidth} viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
    accessible={!decorative} accessibilityRole="image" accessibilityLabel={decorative ? undefined : 'ARgala'}
    importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} pointerEvents="none">
    <G transform={lockup?.arch}>
      <Path d={brandGeometry.arch} fill={seafoam} />
      <Path d={brandGeometry.crossbar} fill={ink} />
    </G>
    {lockup && <G transform={lockup.wordmark} fill={ink}>
      {brandGeometry.letters.map((letter, index) => <Path key={index} d={letter.d} transform={letter.transform} />)}
    </G>}
  </Svg>;
}
