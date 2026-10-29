import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ARgala',
  slug: 'argala',
  platforms: ['android'],
  android: {
    ...config.android,
    package: 'com.mjfelecio.argala',
    permissions: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA', 'android.permission.POST_NOTIFICATIONS'],
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO', 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED', 'android.permission.ACCESS_MEDIA_LOCATION'],
  },
  plugins: [
    './plugins/with-save-only-media',
    'expo-router',
    ['expo-splash-screen', { backgroundColor: '#ffffff', image: './assets/images/splash-icon.png', imageWidth: 76 }],
    ['expo-camera', { recordAudioAndroid: false, barcodeScannerEnabled: false }],
    ['expo-location', { isAndroidBackgroundLocationEnabled: true, isAndroidForegroundServiceEnabled: false }],
    ['expo-notifications', { defaultChannel: 'destination-nearby' }],
    ['expo-media-library', { granularPermissions: [], isAccessMediaLocationEnabled: false }],
    'expo-sharing',
    // SDK 57 manifest mods run in reverse registration order: normalize last.
    './plugins/with-optional-ar',
    ['@reactvision/react-viro', { android: { xRMode: ['AR'] }, provider: 'none' }],
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
