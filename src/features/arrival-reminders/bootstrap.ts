import { optionalTaskManager, optionalNotifications, reminderNative, scheduleReminder } from './native';
import { REMINDER_TASK } from './model';
import { reminderRepository } from './runtime';
import { executeReminderTask } from './task-executor';
/** Import synchronously BEFORE expo-router/entry. Definition alone never requests permissions or starts geofences. */
const taskManager=optionalTaskManager();
if(taskManager&&!taskManager.isTaskDefined(REMINDER_TASK)){
 taskManager.defineTask(REMINDER_TASK,body=>executeReminderTask(body,reminderRepository,{check:()=>reminderNative.check(),schedule:scheduleReminder,cancel:reminderNative.cancel,retire:async()=>{try{await reminderRepository.setActive(null);}finally{await reminderNative.unregister();}}}));
}
const notifications=optionalNotifications();
notifications?.setNotificationHandler({handleNotification:async notification=>({shouldShowBanner:notification.request.content.data?.kind==='destination-arrival',shouldShowList:notification.request.content.data?.kind==='destination-arrival',shouldPlaySound:false,shouldSetBadge:false})});
