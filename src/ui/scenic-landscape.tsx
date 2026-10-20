import { useThemeColor } from 'heroui-native/hooks';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// Original abstract scenery, drawn from existing theme colors. It makes no
// claim about a real destination and needs no remote or unlicensed photograph.
export function ScenicLandscape() {
  const [mint, primary, strong] = useThemeColor(['surface-secondary', 'accent', 'surface-secondary-foreground']);
  return <View className="absolute inset-0" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice">
      <Circle cx="325" cy="75" r="42" fill={mint} />
      <Path d="M0 230 Q65 110 145 204 Q220 100 305 180 Q355 128 400 180 L400 320 L0 320Z" fill={primary} opacity={0.12} />
      <Path d="M0 275 Q90 210 160 255 Q270 178 400 245 L400 320 L0 320Z" fill={strong} opacity={0.1} />
      <Path d="M0 300 Q140 265 230 290 Q330 270 400 290 L400 320 L0 320Z" fill={primary} opacity={0.1} />
    </Svg>
  </View>;
}

