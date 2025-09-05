// React Native + Notifee implementation (scheduling, channels, local display, analytics hooks)
// Note: This file is designed for React Native apps using @react-native-firebase/messaging and @notifee/react-native.
// Ensure you have installed: @notifee/react-native and @react-native-firebase/messaging & analytics.

import notifee, { AndroidImportance, AndroidVisibility, TimestampTrigger, TriggerType, AndroidStyle, EventType, AndroidForegroundServiceType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import { AppState, Platform } from 'react-native';

const CHANNELS = {
  reminders: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Reminder notifications',
    vibrationPattern: [300, 200, 300],
    importance: AndroidImportance.HIGH,
  },
  alarms: {
    id: 'alarms',
    name: 'Alarms',
    description: 'Time-critical alarms',
    vibrationPattern: [500, 200, 500, 200, 700],
    importance: AndroidImportance.HIGH,
  },
  critical: {
    id: 'critical',
    name: 'Critical Alerts',
    description: 'Critical notifications (user may override)',
    vibrationPattern: [700, 200, 700, 200, 1000],
    importance: AndroidImportance.HIGH,
  },
};

class NotificationService {
  initialized = false;

  async initialize() {
    if (this.initialized) return;
    await this.requestPermissions();
    await this.createChannels();
    this.registerForegroundListener();
    this.initialized = true;
  }

  async requestPermissions() {
    // iOS request
    if (Platform.OS === 'ios') {
      await notifee.requestPermission();
    }
    // FCM token permission (iOS requires user-allowed)
    await messaging().requestPermission();
  }

  async getFcmToken() {
    const token = await messaging().getToken();
    await analytics().logEvent('fcm_token_refreshed', { token_present: !!token });
    return token;
  }

  async onTokenRefresh(handler) {
    return messaging().onTokenRefresh(async (token) => {
      await analytics().logEvent('fcm_token_refreshed', { token_present: !!token });
      handler?.(token);
    });
  }

  async createChannels() {
    if (Platform.OS !== 'android') return;
    for (const key of Object.keys(CHANNELS)) {
      const c = CHANNELS[key];
      await notifee.createChannel({
        id: c.id,
        name: c.name,
        description: c.description,
        importance: c.importance,
        vibration: true,
        vibrationPattern: c.vibrationPattern,
        visibility: AndroidVisibility.PUBLIC,
        lights: true,
      });
    }
  }

  async displayLocalNotification({ title, body, channelId = CHANNELS.reminders.id, data = {} }) {
    await analytics().logEvent('notification_sent', { origin: 'local', channelId, hasData: Object.keys(data).length > 0 });
    return notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        vibrationPattern: CHANNELS[channelId]?.vibrationPattern || CHANNELS.reminders.vibrationPattern,
        style: { type: AndroidStyle.BIGTEXT, text: body },
        foregroundService: true,
        asForegroundService: true,
        // foreground service type to increase reliability for alarms/reminders
        foregroundServiceType: AndroidForegroundServiceType.NONE,
      },
      ios: {
        // iOS vibration follows system settings; use sound default
        sound: 'default',
        interruptionLevel: 'timeSensitive',
      },
      data,
    });
  }

  async scheduleLocalNotification({ id, title, body, date, channelId = CHANNELS.reminders.id, data = {} }) {
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Math.max(date.getTime(), Date.now() + 1000),
      alarmManager: true,
    };
    await analytics().logEvent('notification_scheduled', { channelId, when: date.getTime() });
    return notifee.createTriggerNotification({
      id: String(id || Date.now()),
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        vibrationPattern: CHANNELS[channelId]?.vibrationPattern || CHANNELS.reminders.vibrationPattern,
      },
      ios: { sound: 'default' },
      data,
    }, trigger as TimestampTrigger);
  }

  async cancelNotification(id) {
    await notifee.cancelNotification(String(id));
    await analytics().logEvent('notification_cancelled', { id: String(id) });
  }

  async cancelAll() {
    await notifee.cancelAllNotifications();
    await analytics().logEvent('notification_cancel_all', {});
  }

  // Foreground events (opened/press)
  registerForegroundListener() {
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.DELIVERED) {
        await analytics().logEvent('notification_received', { origin: 'local_or_push', id: detail.notification?.id || 'unknown' });
      }
      if (type === EventType.PRESS) {
        await analytics().logEvent('notification_opened', { id: detail.notification?.id || 'unknown' });
      }
    });
  }
}

export default new NotificationService();


