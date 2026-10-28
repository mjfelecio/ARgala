import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

/** Follow the native dock on the UI thread, without waiting for map credit updates. */
export function MapRecenter({ position, onPress, disabled = false }: { disabled?: boolean; position: SharedValue<number>; onPress(): void }) {
  const { t } = useTranslation();
  const ink = useThemeColor('default-foreground');
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, position.get() - 64) }],
    opacity: position.get() > 0 ? 1 : 0,
  }));
  return <Animated.View testID="map-recenter" className="absolute right-4 top-0" style={style}>
    <Button isIconOnly variant="secondary" className="size-12 rounded-card bg-surface shadow-sm" isDisabled={disabled} accessibilityState={{ disabled }} accessibilityLabel={t('map.recenter')} onPress={onPress}>
      <Ionicons name="locate-outline" size={22} color={ink} />
    </Button>
  </Animated.View>;
}
