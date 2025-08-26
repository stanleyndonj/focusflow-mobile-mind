
import { LocalNotifications, ScheduleOptions, ActionPerformed, Channel, LocalNotificationsPlugin } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from '@/components/ui/use-toast';

class NotificationService {
  private channels: Channel[] = [
    {
      id: 'task-notifications',
      name: 'Task Notifications',
      description: 'Notifications for task reminders',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'beep.wav',
      vibration: true,
      lights: true
    },
    {
      id: 'timer-notifications',
      name: 'Timer Notifications',
      description: 'Notifications for timer completion',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'timer-complete.mp3',
      vibration: true,
      lights: true
    },
    {
      id: 'urgent-notifications',
      name: 'Urgent Notifications',
      description: 'High-priority notifications with continuous alerts',
      importance: 5, // Max importance
      visibility: 1, // Public - show on lock screen
      sound: 'urgent.wav',
      vibration: true,
      lights: true,
      // lockscreenVisibility: 1, // Property not available in current Channel type
      enableVibration: true,
      enableLights: true
    }
  ];

  private permissionRequested = false;
  private hasPermission = false;

  constructor() {
    this.initializeChannels();
    this.registerListeners();
  }

  public async initializeChannels() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Create channels with default sounds first
        await LocalNotifications.createChannel(this.channels[0]);
        await LocalNotifications.createChannel(this.channels[1]);
        await LocalNotifications.createChannel(this.channels[2]);
        console.log('Notification channels created');
        
        // After creating channels, check if we have custom sounds
        await this.setupCustomSounds();
      } catch (error) {
        console.error('Error creating notification channels:', error);
      }
    }
  }

  private async setupCustomSounds() {
    try {
      const customTaskSound = localStorage.getItem('customTaskSound');
      const customTimerSound = localStorage.getItem('customTimerSound');
      
      // Update channel with custom sounds if available
      if (customTaskSound) {
        const taskChannel = {...this.channels[0], sound: 'custom-task-sound.mp3'};
        await LocalNotifications.createChannel(taskChannel);
        console.log('Updated task channel with custom sound');
      }
      
      if (customTimerSound) {
        const timerChannel = {...this.channels[1], sound: 'custom-timer-sound.mp3'};
        await LocalNotifications.createChannel(timerChannel);
        console.log('Updated timer channel with custom sound');
      }
    } catch (error) {
      console.error('Error setting up custom sounds:', error);
    }
  }

  private async registerListeners() {
    try {
      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction: ActionPerformed) => {
        console.log('Notification action performed:', notificationAction);
        
        const { actionId, notification } = notificationAction;
        const { extra } = notification;
        
        // Handle different actions
        if (actionId === 'dismiss') {
          console.log('Urgent notification dismissed');
          // Cancel any pending reminders for this notification
          if (extra?.isUrgent) {
            await this.cancelUrgentReminders(notification.id);
          }
        } else if (actionId === 'snooze') {
          console.log('Urgent notification snoozed');
          // Schedule a new notification 5 minutes from now
          const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
          await this.scheduleTaskNotification(
            extra?.taskId || 'snoozed-task',
            notification.title.replace('🚨 URGENT: ', ''),
            notification.body.replace('⚠️ ', '').replace(' - Tap to dismiss', ''),
            snoozeTime,
            true
          );
          // Cancel original reminders
          await this.cancelUrgentReminders(notification.id);
        }
      });

      // Listen for notification received (when app is in foreground)
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received in foreground:', notification);
        
        // For urgent notifications in foreground, show in-app alert
        if (notification.extra?.isUrgent && localStorage.getItem('urgentNotifications') === 'true') {
          this.showInAppUrgentAlert(notification.title, notification.body);
        }
      });

      // Listen for app resume event to check for pending notifications
      if (Capacitor.isNativePlatform()) {
        try {
          document.addEventListener('resume', this.checkPendingNotifications);
          console.log('Resume event listener registered');
        } catch (error) {
          console.error('Error registering resume event listener:', error);
        }
      }
    } catch (error) {
      console.error('Error registering notification listeners:', error);
    }
  }

  // Cancel urgent reminder notifications
  private async cancelUrgentReminders(baseId: number): Promise<void> {
    try {
      const reminders = [baseId + 1000, baseId + 2000, baseId + 3000];
      await LocalNotifications.cancel({ notifications: reminders.map(id => ({ id })) });
      console.log('Cancelled urgent reminder notifications');
    } catch (error) {
      console.error('Error cancelling urgent reminders:', error);
    }
  }

  // Show in-app urgent alert for foreground notifications
  private showInAppUrgentAlert(title: string, body: string): void {
    // Create a persistent alert overlay
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    alertDiv.innerHTML = `
      <div class="bg-red-600 text-white p-6 rounded-lg shadow-xl max-w-sm mx-4 animate-pulse">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-2">🚨</span>
          <h3 class="text-lg font-bold">URGENT TASK</h3>
        </div>
        <h4 class="font-semibold mb-2">${title.replace('🚨 URGENT: ', '')}</h4>
        <p class="text-sm mb-4">${body.replace('⚠️ ', '').replace(' - Tap to dismiss', '')}</p>
        <div class="flex gap-2">
          <button id="urgentDismiss" class="bg-white text-red-600 px-4 py-2 rounded font-semibold flex-1">
            Dismiss
          </button>
          <button id="urgentSnooze" class="bg-red-800 text-white px-4 py-2 rounded font-semibold flex-1">
            Snooze 5min
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Play urgent sound and vibrate
    const audio = new Audio('/sounds/urgent.wav');
    audio.volume = 0.8;
    audio.play().catch(e => console.log('Could not play urgent sound:', e));
    
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Handle button clicks
    const dismissBtn = alertDiv.querySelector('#urgentDismiss');
    const snoozeBtn = alertDiv.querySelector('#urgentSnooze');
    
    dismissBtn?.addEventListener('click', () => {
      document.body.removeChild(alertDiv);
    });
    
    snoozeBtn?.addEventListener('click', () => {
      document.body.removeChild(alertDiv);
      // Could trigger snooze logic here
    });
    
    // Auto-remove after 30 seconds
    this.urgentRingtone = setTimeout(() => {
      if (document.body.contains(alertDiv)) {
        document.body.removeChild(alertDiv);
      }
    }, 30000);
  }

  private async checkPendingNotifications() {
    try {
      const pendingNotifications = await LocalNotifications.getPending();
      console.log('Pending notifications:', pendingNotifications);
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Don't request permissions repeatedly if already denied
      if (this.permissionRequested && !this.hasPermission) {
        console.log('Permissions already requested and denied');
        return false;
      }

      // Check current permission status first
      const currentStatus = await LocalNotifications.checkPermissions();
      console.log('Current notification permission status:', currentStatus);
      
      if (currentStatus.display === 'granted') {
        this.hasPermission = true;
        return true;
      }

      // Only request if not already denied
      if (currentStatus.display === 'prompt') {
        this.permissionRequested = true;
        const permissionState = await LocalNotifications.requestPermissions();
        console.log('Notification permission request result:', permissionState);
        
        this.hasPermission = permissionState.display === 'granted';
        
        if (!this.hasPermission) {
          // Only show toast once when permission is first denied
          if (!localStorage.getItem('notificationPermissionDenied')) {
            localStorage.setItem('notificationPermissionDenied', 'true');
            toast({
              title: "Notifications disabled",
              description: "To receive task reminders, please enable notifications in your device settings and refresh the app.",
              variant: "destructive"
            });
          }
        } else {
          // Clear the denial flag if permission is granted
          localStorage.removeItem('notificationPermissionDenied');
        }
        
        return this.hasPermission;
      }

      // Permission was already denied
      if (currentStatus.display === 'denied') {
        this.hasPermission = false;
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskNotification(taskId: string, title: string, body: string, scheduledTime: Date, isUrgent: boolean = false): Promise<void> {
    // Check permission before attempting to schedule
    const hasPermission = await this.checkAndRequestPermission();
    
    if (!hasPermission) {
      console.warn('Cannot schedule notification: permission not granted');
      // Show fallback notification in browser
      this.showBrowserNotification(title, body, isUrgent);
      return;
    }
    
    const useUrgentStyle = isUrgent && localStorage.getItem('urgentNotifications') === 'true';
    
    try {
      // Calculate a numeric id from the taskId string (must be an integer)
      const numericId = parseInt(taskId.replace(/\D/g, '').slice(0, 8) || '1000');
      
      // Ensure the scheduledTime is in the future
      const notificationTime = new Date(scheduledTime);
      if (notificationTime.getTime() <= Date.now()) {
        console.warn('Scheduled time is in the past, adjusting to now + 5 seconds');
        notificationTime.setTime(Date.now() + 5000);
      }
      
      // Get custom sound if available
      const customTaskSound = localStorage.getItem('customTaskSound');
      const customTaskSoundName = localStorage.getItem('customTaskSoundName');
      
      // Determine sound to use
      let soundToUse = 'beep.wav'; // default
      if (useUrgentStyle) {
        soundToUse = 'urgent.wav';
      } else if (customTaskSound) {
        soundToUse = 'custom-task-sound.mp3';
      }
      
      // Schedule the notification with enhanced urgent style features
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: useUrgentStyle ? `🚨 URGENT: ${title}` : title,
            body: useUrgentStyle ? `⚠️ ${body} - Tap to dismiss` : body,
            schedule: { 
              at: notificationTime,
              allowWhileIdle: true, // Ensure delivery even in doze mode
              repeats: false // One-time notification
            },
            sound: soundToUse,
            smallIcon: 'ic_stat_focus_brain',
            iconColor: useUrgentStyle ? '#EF4444' : '#8B5CF6', // Red for urgent, purple for normal
            channelId: useUrgentStyle ? 'urgent-notifications' : 'task-notifications',
            autoCancel: !useUrgentStyle, // Urgent notifications require manual dismissal
            ongoing: useUrgentStyle, // Keep urgent notifications visible
            priority: useUrgentStyle ? 2 : 1, // Max priority for urgent
            visibility: 1, // Show on lock screen
            extra: {
              taskId: taskId,
              isUrgent: useUrgentStyle,
              customSound: customTaskSoundName || null
            },
            // Enhanced urgent notification features
            ...(useUrgentStyle && {
              actions: [
                {
                  id: 'dismiss',
                  title: 'Dismiss',
                  destructive: false
                },
                {
                  id: 'snooze',
                  title: 'Snooze 5min',
                  destructive: false
                }
              ]
            })
          }
        ]
      });
      
      // For urgent notifications, also schedule repeating reminders until dismissed
      if (useUrgentStyle) {
        await this.scheduleUrgentReminders(numericId, title, body, notificationTime);
      }
      
      console.log(`Scheduled ${useUrgentStyle ? 'urgent ' : ''}task notification for task ${taskId} at ${notificationTime.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Failed to set notification",
        description: "There was an error scheduling your task notification.",
        variant: "destructive"
      });
    }
  }

  // Schedule repeating urgent reminders
  private async scheduleUrgentReminders(baseId: number, title: string, body: string, startTime: Date): Promise<void> {
    try {
      // Schedule 3 follow-up reminders at 2-minute intervals
      for (let i = 1; i <= 3; i++) {
        const reminderTime = new Date(startTime.getTime() + (i * 2 * 60 * 1000)); // 2, 4, 6 minutes later
        const reminderId = baseId + (i * 1000); // Ensure unique IDs
        
        await LocalNotifications.schedule({
          notifications: [
            {
              id: reminderId,
              title: `🔔 REMINDER: ${title}`,
              body: `Still pending: ${body}`,
              schedule: { 
                at: reminderTime,
                allowWhileIdle: true
              },
              sound: 'urgent.wav',
              smallIcon: 'ic_stat_focus_brain',
              iconColor: '#EF4444',
              channelId: 'urgent-notifications',
              autoCancel: false,
              ongoing: true,
              // priority: 'high', // Property not available in LocalNotificationSchema
              extra: {
                isUrgentReminder: true,
                originalId: baseId
              }
            }
          ]
        });
      }
      
      console.log('Scheduled urgent reminder notifications');
    } catch (error) {
      console.error('Error scheduling urgent reminders:', error);
    }
  }

  private async checkAndRequestPermission(): Promise<boolean> {
    if (this.hasPermission) {
      return true;
    }

    return await this.requestPermissions();
  }

  private showBrowserNotification(title: string, body: string, isUrgent: boolean = false) {
    // Fallback to browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        isUrgent ? `🚨 URGENT: ${title}` : title, 
        { 
          body: isUrgent ? `⚠️ ${body} - Click to dismiss` : body, 
          icon: '/favicon.ico',
          requireInteraction: isUrgent, // Keep urgent notifications visible until clicked
          tag: isUrgent ? 'urgent-task' : 'task-notification' // Replace previous notifications
        }
      );
      
      // For urgent notifications, play continuous sound and vibration
      if (isUrgent && localStorage.getItem('urgentNotifications') === 'true') {
        this.playUrgentBrowserAlert(notification);
      }
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(title, body, isUrgent);
        }
      });
    }
  }

  private playUrgentBrowserAlert(notification: Notification) {
    // Play urgent sound repeatedly until notification is dismissed
    let alertInterval: NodeJS.Timeout;
    let vibrationInterval: NodeJS.Timeout;
    
    const playUrgentSound = () => {
      // Create audio element for urgent sound
      const audio = new Audio('/sounds/urgent.wav');
      audio.volume = 0.8;
      audio.play().catch(e => console.log('Could not play urgent sound:', e));
    };
    
    const vibrateDevice = () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]); // Urgent vibration pattern
      }
    };
    
    // Play sound and vibrate immediately
    playUrgentSound();
    vibrateDevice();
    
    // Continue playing sound every 3 seconds
    alertInterval = setInterval(() => {
      playUrgentSound();
    }, 3000);
    
    // Continue vibrating every 5 seconds
    vibrationInterval = setInterval(() => {
      vibrateDevice();
    }, 5000);
    
    // Stop when notification is closed
    notification.onclose = () => {
      clearInterval(alertInterval);
      clearInterval(vibrationInterval);
    };
    
    notification.onclick = () => {
      clearInterval(alertInterval);
      clearInterval(vibrationInterval);
      notification.close();
    };
    
    // Auto-stop after 2 minutes
    this.urgentVibratePattern = setTimeout(() => {
      clearInterval(alertInterval);
      clearInterval(vibrationInterval);
    }, 120000);
  }

  async scheduleTimerNotification(title: string, body: string, scheduledTime: Date) {
    const hasPermission = await this.checkAndRequestPermission();
    
    if (!hasPermission) {
      console.warn('Cannot schedule timer notification: permission not granted');
      this.showBrowserNotification(title, body);
      return false;
    }
    
    // Determine which sound to use (custom or default)
    const hasCustomSound = localStorage.getItem('customTimerSound') !== null;
    
    try {
      // Generate a unique ID for timer notifications
      const numericId = Math.floor(Date.now() / 1000);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: title,
            body: body,
            schedule: { 
              at: scheduledTime,
              allowWhileIdle: true
            },
            sound: hasCustomSound ? 'custom-timer-sound.mp3' : 'timer-complete.mp3',
            smallIcon: 'ic_stat_focus_brain',
            iconColor: '#8B5CF6',
            channelId: 'timer-notifications',
            autoCancel: true,
            ongoing: false
          }
        ]
      });
      
      console.log(`Timer notification scheduled at ${scheduledTime.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error scheduling timer notification:', error);
      toast({
        title: "Failed to set notification",
        description: "There was an error scheduling your timer notification.",
        variant: "destructive"
      });
      return false;
    }
  }

  async cancelNotification(taskIdOrId: string | number) {
    try {
      let notificationId: number;
      if (typeof taskIdOrId === 'string') {
        notificationId = parseInt(taskIdOrId.replace(/\D/g, '').slice(0, 8) || '1000');
        console.log(`Cancelled notification for task ${taskIdOrId}`);
      } else {
        notificationId = taskIdOrId;
        console.log(`Cancelled notification with id: ${notificationId}`);
      }
      
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  async cancelAllNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        for (const notification of pending.notifications) {
          await this.cancelNotification(notification.id);
        }
      }
      console.log('Cancelled all notifications');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  // Update custom sound for notifications
  async updateCustomSound(type: 'timer' | 'task', soundName: string): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true; // Only needed for native platforms
      }

      const channelId = type === 'timer' ? 'timer-notifications' : 'task-notifications';
      const channelIndex = type === 'timer' ? 1 : 0;
      const soundFileName = type === 'timer' ? 'custom-timer-sound.mp3' : 'custom-task-sound.mp3';
      
      // If soundName is empty, reset to default
      if (!soundName) {
        const defaultSound = type === 'timer' ? 'timer-complete.mp3' : 'beep.wav';
        const defaultChannel = {...this.channels[channelIndex], sound: defaultSound};
        await LocalNotifications.createChannel(defaultChannel);
        console.log(`Reset ${type} notification channel to default sound`);
        return true;
      }
      
      // Update the channel with the new sound
      const updatedChannel = {
        ...this.channels[channelIndex],
        sound: soundFileName
      };
      
      await LocalNotifications.createChannel(updatedChannel);
      console.log(`Updated ${type} notification channel with custom sound: ${soundName}`);
      return true;
    } catch (error) {
      console.error(`Error updating ${type} custom sound:`, error);
      return false;
    }
  }

  // Test urgent notification (for settings testing)
  async testUrgentNotification(): Promise<void> {
    const testTime = new Date(Date.now() + 2000); // 2 seconds from now
    await this.scheduleTaskNotification(
      'test-urgent',
      'Test Urgent Notification',
      'This is a test of the urgent notification system',
      testTime,
      true
    );
  }

  // Get current permission status
  getPermissionStatus(): boolean {
    return this.hasPermission;
  }

  // Reset permission request flag (useful for testing)
  resetPermissionState() {
    this.permissionRequested = false;
    this.hasPermission = false;
    localStorage.removeItem('notificationPermissionDenied');
  }
}

export default new NotificationService();
