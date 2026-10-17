import { Text } from 'react-native';
import { environment } from '@/config/env';
import { Notice, Screen, styles } from '@/ui/shared';

export default function HomeScreen() {
  return <Screen><Text style={styles.title}>ARgala</Text><Notice>{environment.success ? 'Application configured.' : 'Application setup is required. Configure the Supabase project in .env.'}</Notice></Screen>;
}
