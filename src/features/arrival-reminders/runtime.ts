import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderRepository } from './repository';
export const reminderRepository=new ReminderRepository(AsyncStorage);
