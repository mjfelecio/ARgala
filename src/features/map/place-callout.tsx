import { Text, View } from 'react-native';
import { Callout } from 'react-native-maps';
import { withUniwind } from 'uniwind';

const StyledCallout = withUniwind(Callout);

/** Native info-window content only: pins keep their native rendering path. */
export function PlaceCallout({ name }: { name: string }) {
  return <StyledCallout tooltip accessibilityLabel={name}>
    <View className="w-56 rounded-card border border-outline bg-surface px-4 py-3">
      <Text className="border-l-2 border-brand-primary pl-3 font-sans text-sm font-semibold text-foreground">{name}</Text>
    </View>
  </StyledCallout>;
}
