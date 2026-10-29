import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Location from 'expo-location';
import type * as Notifications from 'expo-notifications';
import type * as TaskManager from 'expo-task-manager';
import { requestLocationPermission } from '@/features/location/service';
import type { ReminderNative } from './controller';
import { REMINDER_CHANNEL, REMINDER_TASK, notificationIdentifier, type ReminderSelection } from './model';
import { destinationName, getDestination } from '@/features/destinations/catalog';
import en from '@/i18n/locales/en.json';
import ja from '@/i18n/locales/ja.json';
import ko from '@/i18n/locales/ko.json';
// A native dependency may be in the JS bundle while the installed APK predates it.
export function optionalTaskManager():typeof TaskManager|null {
 try{if(Platform.OS!=='android'||!requireOptionalNativeModule('ExpoTaskManager'))return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-task-manager') as typeof TaskManager;
 }catch{return null;}
}
export function optionalNotifications():typeof Notifications|null {
 try{if(Platform.OS!=='android'||!['ExpoNotificationPermissionsModule','ExpoNotificationScheduler','ExpoNotificationsHandlerModule','ExpoNotificationsEmitter'].every(name=>requireOptionalNativeModule(name)))return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof Notifications;
 }catch{return null;}
}
type ReminderCopy={channel:string;notificationTitle:string;notificationBody:string};
/** Headless messages use the locale captured with explicit consent, with English fallback. */
function copy(locale:ReminderSelection['locale']):ReminderCopy {
 const resources={en,ja,ko};return (resources[locale] as unknown as {reminders:ReminderCopy}).reminders;
}
function precise(p:Location.LocationPermissionResponse){return p.granted&&p.android?.accuracy!=='coarse';}
type NativeDependencies={task:()=>typeof TaskManager|null;notifications:()=>typeof Notifications|null;location:typeof Location;foreground:typeof requestLocationPermission};
export function createReminderNative({task:getTask=optionalTaskManager,notifications:getNotifications=optionalNotifications,location=Location,foreground=requestLocationPermission}:Partial<NativeDependencies>={}):ReminderNative {
 let permissionWork:Promise<boolean>|null=null;
 return {
 available:()=>!!getTask()&&!!getNotifications(),
 async check(){const task=getTask();const notifications=getNotifications();if(!task||!notifications)return false;
  const [foreground,background,notification,enabled,available]=await Promise.all([location.getForegroundPermissionsAsync(),location.getBackgroundPermissionsAsync(),notifications.getPermissionsAsync(),location.hasServicesEnabledAsync(),task.isAvailableAsync()]);
  const requiresChannel=Number(Platform.Version)>=26;
  const channel=requiresChannel?await notifications.getNotificationChannelAsync(REMINDER_CHANNEL):null;
  const channelAllowed=!requiresChannel||(!!channel&&channel.importance!==notifications.AndroidImportance.NONE);
  return precise(foreground)&&background.granted&&notification.granted&&enabled&&available&&channelAllowed;
 },
 request(explain,isCurrent=()=>true,locale='en'){if(permissionWork)return permissionWork;
  let live=true;
  let timer:ReturnType<typeof setTimeout>;
  const current=()=>live&&isCurrent();
  const work=(async()=>{const notifications=getNotifications();const task=getTask();if(!notifications||!task||!current()||!await task.isAvailableAsync())return false;
   const permission=await foreground({prompt:'retry'});if(!precise(permission)||!current())return false;
   // Android 13 needs a channel before it can present the notification prompt.
   await notifications.setNotificationChannelAsync(REMINDER_CHANNEL,{name:copy(locale).channel,importance:notifications.AndroidImportance.DEFAULT});if(!current())return false;
   let notification=await notifications.getPermissionsAsync();if(!current())return false;
   if(!notification.granted&&notification.canAskAgain)notification=await notifications.requestPermissionsAsync();if(!notification.granted||!current())return false;
   let background=await location.getBackgroundPermissionsAsync();if(!current())return false;
   if(!background.granted){if(!await explain()||!current())return false;background=await location.requestBackgroundPermissionsAsync();}
   return current()&&background.granted&&await this.check();
  })();
  permissionWork=Promise.race([work,new Promise<boolean>(resolve=>{timer=setTimeout(()=>{live=false;resolve(false);},120_000);})]).finally(()=>{live=false;clearTimeout(timer);permissionWork=null;});return permissionWork;
 },
 async register(regions){await location.startGeofencingAsync(REMINDER_TASK,regions);},
 async unregister(){const task=getTask();if(!task)return;if(!await task.isTaskRegisteredAsync(REMINDER_TASK))return;
  // expo-location requires background permission even to stop; TaskManager does not.
  try{await location.stopGeofencingAsync(REMINDER_TASK);}catch{if(await task.isTaskRegisteredAsync(REMINDER_TASK))await task.unregisterTaskAsync(REMINDER_TASK);}
 },
 async cancel(identifier){const n=getNotifications();if(!n)return;await n.cancelScheduledNotificationAsync(identifier);await n.dismissNotificationAsync(identifier);},
};
}
export const reminderNative=createReminderNative();
export async function scheduleReminder(selection:ReminderSelection){const n=optionalNotifications();const destination=getDestination(selection.destinationId);if(!n||!destination)return;const text=copy(selection.locale);
 await n.scheduleNotificationAsync({identifier:notificationIdentifier(selection),content:{title:text.notificationTitle,body:text.notificationBody.replace('{{destination}}',destinationName(destination)),data:{kind:'destination-arrival',destinationId:selection.destinationId,generation:selection.generation}},trigger:{channelId:REMINDER_CHANNEL}});
}
