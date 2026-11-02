import { Text, View, type ColorValue } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

export function AppTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [active, inactive] = useThemeColor(['accent', 'muted']);
  const barStyle = useResolveClassNames('h-16 border-t-0 bg-page shadow-none');
  const labelStyle = useResolveClassNames('font-sans text-xs font-ui-medium');
  return <Tabs initialRouteName="index" backBehavior="initialRoute" screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: active,
    tabBarInactiveTintColor: inactive,
    tabBarLabelStyle: labelStyle,
    tabBarLabelPosition: 'below-icon',
    // The bar participates in layout. The map/sheet measure only their scene,
    // while the navigator reserves Android's bottom inset exactly once.
    tabBarStyle: { ...barStyle, height: (barStyle.height as number) + insets.bottom, elevation: 0 },
  }}>
    <Tabs.Screen name="index" options={{ title: t('navigation.explore'), tabBarButtonTestID: 'tab-explore',
      tabBarLabel: ({focused,color,children}) => <TabLabel focused={focused} color={color}>{children}</TabLabel>,
      tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? 'location' : 'location-outline'} color={color} size={size} /> }} />
    <Tabs.Screen name="ar" options={{ href: null, title: t('navigation.ar'), tabBarButtonTestID: 'tab-ar', headerShown: false,
      tabBarStyle: { display: 'none' },
      tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: t('navigation.profile'), headerShown: false, tabBarButtonTestID: 'tab-profile',
      tabBarLabel: ({focused,color,children}) => <TabLabel focused={focused} color={color}>{children}</TabLabel>,
      tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} /> }} />
  </Tabs>;
}

function TabLabel({focused,color,children}:{focused:boolean;color:ColorValue;children:string}) {
 return <View className="items-center gap-1">
   <Text className="font-sans text-xs font-ui-medium" style={{color}}>{children}</Text>
   {focused ? <View testID="active-tab-indicator" className="size-1.5 rounded-pill bg-seafoam" accessible={false} importantForAccessibility="no-hide-descendants"/> : <View className="size-1.5" accessible={false}/>}
 </View>;
}
