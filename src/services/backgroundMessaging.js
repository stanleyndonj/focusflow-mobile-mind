// React Native Firebase background message handler that displays notifications via Notifee
import messaging from '@react-native-firebase/messaging';
import NotificationService from './NotificationService.rn';
import analytics from '@react-native-firebase/analytics';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Reminder';
    const body = remoteMessage.notification?.body || remoteMessage.data?.body || 'You have a reminder';
    const channelId = remoteMessage.data?.type === 'alarm' ? 'alarms' : 'reminders';
    await NotificationService.displayLocalNotification({ title, body, channelId, data: remoteMessage.data || {} });
    await analytics().logEvent('notification_received_background', { channelId, hasData: !!remoteMessage.data });
  } catch (e) {
    await analytics().logEvent('notification_failed', { stage: 'background_handler', message: String(e) });
  }
});

export default null;


