import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';
import { AppHeader } from './app-header';

export function AppTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [active, inactive] = useThemeColor(['accent', 'muted']);
  const barStyle = useResolveClassNames('h-16 border-t-0 bg-page-mint shadow-none');
  const labelStyle = useResolveClassNames('font-sans text-xs font-medium');
  return <Tabs initialRouteName="index" backBehavior="initialRoute" screenOptions={{
    header: ({ options }) => <AppHeader label={options.title ?? t('navigation.explore')} />,
    tabBarActiveTintColor: active,
    tabBarInactiveTintColor: inactive,
    tabBarLabelStyle: labelStyle,
    tabBarLabelPosition: 'below-icon',
    // The bar participates in layout. The map/sheet measure only their scene,
    // while the navigator reserves Android's bottom inset exactly once.
    tabBarStyle: { ...barStyle, height: (barStyle.height as number) + insets.bottom, elevation: 0 },
  }}>
    <Tabs.Screen name="index" options={{ title: t('navigation.explore'), tabBarButtonTestID: 'tab-explore',
      tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? 'location' : 'location-outline'} color={color} size={size} /> }} />
    <Tabs.Screen name="ar" options={{ title: t('navigation.ar'), tabBarButtonTestID: 'tab-ar', headerShown: false,
      tabBarStyle: { display: 'none' },
      tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: t('navigation.profile'), headerShown: false, tabBarButtonTestID: 'tab-profile',
      tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} /> }} />
  </Tabs>;
}
