import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ARgala',
  slug: 'argala',
  platforms: ['android'],
  android: {
    ...config.android,
    package: 'com.mjfelecio.argala',
    permissions: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA'],
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.ACCESS_BACKGROUND_LOCATION'],
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { backgroundColor: '#ffffff', image: './assets/images/splash-icon.png', imageWidth: 76 }],
    ['expo-camera', { recordAudioAndroid: false, barcodeScannerEnabled: false }],
    ['expo-location', { isAndroidBackgroundLocationEnabled: false, isAndroidForegroundServiceEnabled: false }],
    'expo-localization',
    ['expo-font', { android: { fonts: [{
      fontFamily: 'PlusJakartaSans',
      fontDefinitions: [
        { path: './node_modules/@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf', weight: 400 },
        { path: './node_modules/@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf', weight: 500 },
        { path: './node_modules/@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf', weight: 600 },
        { path: './node_modules/@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf', weight: 700 },
      ],
    }] } }],
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '' }],
  ],
  extra: {
    ...config.extra,
    mapsConfigured: Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY),
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
});
