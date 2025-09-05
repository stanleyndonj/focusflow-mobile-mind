/**
 * HabitNotificationService - Dedicated service for habit tracking notifications
 * Provides daily reminders with vibration and custom ringtones
 */

import { LocalNotifications, ScheduleOptions, Channel } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Habit } from '../types/habit';

export interface HabitNotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // HH:MM format
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  customRingtone: string;
  reminderMessage: string;
}

class HabitNotificationService {
  private static instance: HabitNotificationService;
  private settings: HabitNotificationSettings;
  private readonly CHANNEL_ID = 'habit-reminders';
  private readonly STORAGE_KEY = 'habit_notification_settings';

  private constructor() {
    this.settings = this.loadSettings();
    this.initializeChannel();
  }

  static getInstance(): HabitNotificationService {
    if (!HabitNotificationService.instance) {
      HabitNotificationService.instance = new HabitNotificationService();
    }
    return HabitNotificationService.instance;
  }

  private loadSettings(): HabitNotificationSettings {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default settings
    return {
      enabled: true,
      dailyReminderTime: '09:00',
      vibrationEnabled: true,
      soundEnabled: true,
      customRingtone: 'habit-reminder.wav',
      reminderMessage: 'Time to check in with your habits! 🌟'
    };
  }

  private saveSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
  }

  private async initializeChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const channel: Channel = {
        id: this.CHANNEL_ID,
        name: 'Habit Reminders',
        description: 'Daily habit tracking reminders',
        importance: 4, // High importance
        visibility: 1, // Public
        sound: this.settings.customRingtone,
        vibration: this.settings.vibrationEnabled,
        lights: true,
        enableVibration: this.settings.vibrationEnabled,
        enableLights: true
      };

      await LocalNotifications.createChannel(channel);
      console.log('Habit notification channel created successfully');
    } catch (error) {
      console.error('Failed to create habit notification channel:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissionStatus = await LocalNotifications.checkPermissions();
        if (permissionStatus.display !== 'granted') {
          const result = await LocalNotifications.requestPermissions();
          return result.display === 'granted';
        }
        return true;
      } else {
        // Web platform
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  getSettings(): HabitNotificationSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<HabitNotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // Update channel if sound or vibration settings changed
    if (newSettings.vibrationEnabled !== undefined || newSettings.customRingtone !== undefined) {
      await this.initializeChannel();
    }

    // Reschedule notifications if enabled status or time changed
    if (newSettings.enabled !== undefined || newSettings.dailyReminderTime !== undefined) {
      await this.scheduleHabitReminders([]);
    }
  }

  async scheduleHabitReminders(habits: Habit[]): Promise<void> {
    if (!this.settings.enabled) {
      await this.cancelAllHabitReminders();
      return;
    }

    try {
      // Cancel existing habit reminders only once per call
      const pending = await LocalNotifications.getPending();
      const alreadyScheduled = pending.notifications.some(n => n.id === 1001);
      if (alreadyScheduled) {
        // Update is not supported uniformly; cancel and reschedule cleanly
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Parse reminder time
      const [hours, minutes] = this.settings.dailyReminderTime.split(':').map(Number);
      
      // Schedule daily reminder
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const activeHabits = habits.filter(h => h.stats.currentStreak >= 0); // Include all habits
      const habitCount = activeHabits.length;
      
      let title = 'Habit Check-in Time! 🌟';
      let body = this.settings.reminderMessage;
      
      if (habitCount > 0) {
        const pendingHabits = activeHabits.filter(h => {
          const today = new Date().toISOString().split('T')[0];
          const todayLog = h.logs[today];
          
          if (h.type === 'good') {
            if (h.trackMode === 'binary') return todayLog !== 1;
            if (h.trackMode === 'count') return (todayLog || 0) < (h.target.times || 1);
            if (h.trackMode === 'duration') return (todayLog || 0) < (h.target.minutes || 0);
          } else {
            return todayLog !== undefined && todayLog !== 0;
          }
          return true;
        });

        if (pendingHabits.length > 0) {
          title = `${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} waiting for you! 💪`;
          body = `Time to log your progress: ${pendingHabits.slice(0, 3).map(h => h.title).join(', ')}${pendingHabits.length > 3 ? ` and ${pendingHabits.length - 3} more` : ''}`;
        } else {
          title = 'Great job on your habits! 🎉';
          body = 'All habits are up to date. Keep up the excellent work!';
        }
      }

      const notificationOptions: ScheduleOptions = {
        notifications: [{
          id: 1001,
          title,
          body,
          schedule: {
            at: reminderTime,
            repeats: true,
            every: 'day'
          },
          sound: this.settings.soundEnabled ? this.settings.customRingtone : undefined,
          channelId: this.CHANNEL_ID,
          extra: {
            type: 'habit-reminder',
            habitCount
          }
        }]
      };

      await LocalNotifications.schedule(notificationOptions);
      console.log('Habit reminder scheduled for', this.settings.dailyReminderTime);

    } catch (error) {
      console.error('Failed to schedule habit reminders:', error);
    }
  }

  async cancelAllHabitReminders(): Promise<void> {
    try {
      // Cancel the daily habit reminder
      await LocalNotifications.cancel({ notifications: [{ id: '1001' }] });
      console.log('Habit reminders cancelled');
    } catch (error) {
      console.error('Failed to cancel habit reminders:', error);
    }
  }

  async triggerTestNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      const testNotification: ScheduleOptions = {
        notifications: [{
          id: 9999,
          title: 'Test Habit Reminder 🧪',
          body: 'This is a test of your habit notification settings!',
          schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds from now
          sound: this.settings.soundEnabled ? this.settings.customRingtone : undefined,
          channelId: this.CHANNEL_ID,
          extra: {
            type: 'test-notification'
          }
        }]
      };

      await LocalNotifications.schedule(testNotification);

      // Trigger vibration if enabled
      if (this.settings.vibrationEnabled && Capacitor.isNativePlatform()) {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          console.warn('Haptics not available:', error);
        }
      }

      console.log('Test habit notification scheduled');
    } catch (error) {
      console.error('Failed to trigger test notification:', error);
      throw error;
    }
  }

  async getScheduledNotifications(): Promise<any[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.filter(n => n.extra?.type === 'habit-reminder');
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Method to handle notification actions when user taps on them
  async handleNotificationAction(notification: any): Promise<void> {
    if (notification.extra?.type === 'habit-reminder') {
      // The app should navigate to the habits page
      // This will be handled by the component that uses this service
      console.log('Habit reminder notification tapped');
      
      // Haptic feedback is handled on receipt below
    }
  }

  // Should be called by consumers to wire vibration for delivered reminders
  async onNotificationReceived(notification: any): Promise<void> {
    try {
      if (notification?.notification?.extra?.type === 'habit-reminder' && this.settings.vibrationEnabled && Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'SUCCESS' as any });
      }
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }

  // Check if it's time to remind about habits (for manual checks)
  isReminderTime(): boolean {
    const now = new Date();
    const [hours, minutes] = this.settings.dailyReminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // Check if current time is within 5 minutes of reminder time
    const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
    return timeDiff <= 5 * 60 * 1000; // 5 minutes in milliseconds
  }
}

export default HabitNotificationService.getInstance();
