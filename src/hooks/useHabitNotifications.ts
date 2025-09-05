/**
 * useHabitNotifications Hook - Integration between habit tracking and notifications
 */

import { useEffect, useCallback, useState } from 'react';
import { useHabitTracker } from './useHabitTracker';
import HabitNotificationService, { HabitNotificationSettings } from '../services/HabitNotificationService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export function useHabitNotifications() {
  const { habits } = useHabitTracker();
  const [settings, setSettings] = useState<HabitNotificationSettings>(
    HabitNotificationService.getSettings()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update notification schedule when habits change
  useEffect(() => {
    if (settings.enabled && habits.length > 0) {
      HabitNotificationService.scheduleHabitReminders(habits);
    }
  }, [habits, settings.enabled]);

  // Listen for notification actions and delivery (for vibration)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleNotificationAction = async (notification: any) => {
      await HabitNotificationService.handleNotificationAction(notification);
    };

    const handleReceived = async (notification: any) => {
      await HabitNotificationService.onNotificationReceived(notification);
    };

    // Add listener for notification actions
    LocalNotifications.addListener('localNotificationActionPerformed', handleNotificationAction);
    LocalNotifications.addListener('localNotificationReceived', handleReceived);

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<HabitNotificationSettings>) => {
    setIsLoading(true);
    try {
      await HabitNotificationService.updateSettings(newSettings);
      const updatedSettings = HabitNotificationService.getSettings();
      setSettings(updatedSettings);
      
      // Reschedule notifications with new settings
      if (updatedSettings.enabled) {
        await HabitNotificationService.scheduleHabitReminders(habits);
      }
    } catch (error) {
      console.error('Failed to update habit notification settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [habits]);

  const testNotification = useCallback(async () => {
    setIsLoading(true);
    try {
      await HabitNotificationService.triggerTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await HabitNotificationService.requestPermissions();
      if (granted && settings.enabled) {
        // Reschedule notifications now that we have permission
        await HabitNotificationService.scheduleHabitReminders(habits);
      }
      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [settings.enabled, habits]);

  const getScheduledNotifications = useCallback(async () => {
    try {
      return await HabitNotificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }, []);

  const rescheduleNotifications = useCallback(async () => {
    if (settings.enabled) {
      await HabitNotificationService.scheduleHabitReminders(habits);
    }
  }, [settings.enabled, habits]);

  return {
    settings,
    isLoading,
    updateSettings,
    testNotification,
    requestPermissions,
    getScheduledNotifications,
    rescheduleNotifications,
    isReminderTime: HabitNotificationService.isReminderTime()
  };
}
