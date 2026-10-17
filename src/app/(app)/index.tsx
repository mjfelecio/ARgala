import { Text } from 'react-native';
import { SignOutAction } from '@/features/auth/sign-out-action';
import { Notice, Screen, styles } from '@/ui/shared';
export default function HomeScreen() {
  return <Screen><Text style={styles.title}>ARgala</Text><Notice>You are signed in.</Notice><SignOutAction /></Screen>;
}
