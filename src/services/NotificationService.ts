
import { LocalNotifications, ScheduleOptions, ActionPerformed, Channel, LocalNotificationsPlugin } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from '@/components/ui/use-toast';
import CustomAudioService from './CustomAudioService';

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
      lights: true,
      enableVibration: true,
      enableLights: true
    },
    {
      id: 'timer-notifications',
      name: 'Timer Notifications',
      description: 'Notifications for timer completion',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'timer-complete.mp3',
      vibration: true,
      lights: true,
      enableVibration: true,
      enableLights: true
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
      enableVibration: true,
      enableLights: true
    },
    {
      id: 'custom-task-notifications',
      name: 'Custom Task Notifications',
      description: 'Task notifications with custom sounds',
      importance: 5,
      visibility: 1,
      sound: 'custom-task-sound.wav',
      vibration: true,
      lights: true,
      enableVibration: true,
      enableLights: true
    },
    {
      id: 'custom-timer-notifications',
      name: 'Custom Timer Notifications',
      description: 'Timer notifications with custom sounds',
      importance: 5,
      visibility: 1,
      sound: 'custom-timer-sound.wav',
      vibration: true,
      lights: true,
      enableVibration: true,
      enableLights: true
    }
  ];

  private permissionRequested = false;
  private hasPermission = false;

  constructor() {
    this.initializeChannels();
    this.registerListeners();
    this.initializeCustomAudio();
    this.setupBackgroundDelivery();
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

  // Public method to refresh channels when custom sounds are added/removed
  public async refreshCustomChannels() {
    if (Capacitor.isNativePlatform()) {
      await this.setupCustomSounds();
      console.log('Custom notification channels refreshed');
    }
  }

  private async setupCustomSounds() {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Web platform detected - custom notification channels not supported, using browser notifications with custom sounds');
        return;
      }

      const hasCustomTaskSound = CustomAudioService.hasCustomAudio('task');
      const hasCustomTimerSound = CustomAudioService.hasCustomAudio('timer');
      
      // Create silent channels for custom sounds (we'll play audio programmatically)
      // Android can't use dynamically uploaded files as channel sounds
      if (hasCustomTaskSound) {
        const customTaskChannel = {
          id: 'custom-task-notifications',
          name: 'Custom Task Notifications',
          description: 'Task notifications with custom sounds',
          importance: 5,
          visibility: 1,
          sound: undefined, // Silent channel - we'll play sound programmatically
          vibration: true,
          lights: true,
          lightColor: '#8B5CF6'
        };
        await LocalNotifications.createChannel(customTaskChannel);
        console.log('Created silent custom task notification channel for programmatic sound playback');
      }
      
      if (hasCustomTimerSound) {
        const customTimerChannel = {
          id: 'custom-timer-notifications', 
          name: 'Custom Timer Notifications',
          description: 'Timer notifications with custom sounds',
          importance: 5,
          visibility: 1,
          sound: undefined, // Silent channel - we'll play sound programmatically
          vibration: true,
          lights: true,
          lightColor: '#8B5CF6'
        };
        await LocalNotifications.createChannel(customTimerChannel);
        console.log('Created silent custom timer notification channel for programmatic sound playback');
      }
    } catch (error) {
      console.error('Error setting up custom sounds:', error);
    }
  }

  private async registerListeners() {
    try {
      // Listen for notification received (foreground and background) - unified handler
      LocalNotifications.addListener('localNotificationReceived', async (notification) => {
        console.log('Notification received:', notification);
        const { extra } = notification;
        const channelType = notification.channelId?.includes('timer') ? 'timer' : 'task';
        const type = (extra?.notificationType as 'timer' | 'task') || (extra?.taskId ? 'task' : channelType);

        // If custom sound, play it (includes vibration on native). Otherwise vibrate normally.
        if (extra?.hasCustomSound) {
          try {
            await this.playCustomSound(type);
          } catch (error) {
            console.error('Error playing custom sound:', error);
          }
        } else {
          await this.triggerVibration(type);
        }

        // Urgent foreground enhancements
        if (extra?.isUrgent && localStorage.getItem('urgentNotifications') === 'true') {
          this.showInAppUrgentAlert(notification.title, notification.body);
          await this.triggerVibration('urgent');
        }
      });
      
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

      // Duplicate foreground listener removed; handled by unified listener above

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
    
    // Enhanced vibration for urgent notifications
    this.triggerVibration('urgent');
    
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

  async checkAndRequestPermission(): Promise<boolean> {
    if (this.hasPermission) {
      return true;
    }

    if (!this.permissionRequested) {
      this.permissionRequested = true;

      try {
        // Check current permission status
        const permissionStatus = await LocalNotifications.checkPermissions();
        console.log('Current notification permissions:', permissionStatus);

        if (permissionStatus.display === 'granted') {
          this.hasPermission = true;
          
          // Request battery optimization exemption for better background delivery
          if (Capacitor.isNativePlatform()) {
            try {
              console.log('Request battery optimization exemption for background notifications');
            } catch (error) {
              console.warn('Could not request battery optimization exemption:', error);
            }
          }
          
          return true;
        }

        // Request permissions if not granted
        const requestResult = await LocalNotifications.requestPermissions();
        console.log('Permission request result:', requestResult);

        if (requestResult.display === 'granted') {
          this.hasPermission = true;
          return true;
        }

        console.warn('Notification permissions denied');
        
        if (!localStorage.getItem('notificationPermissionDenied')) {
          localStorage.setItem('notificationPermissionDenied', 'true');
          // Note: toast import would be needed here
          console.warn("Notifications disabled - enable in device settings");
        }
        
        return false;
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
      }
    }

    // Permission was already requested
    return this.hasPermission;
  }

  async scheduleTaskNotification(taskId: string, title: string, body: string, scheduledTime: Date, isUrgent: boolean = false): Promise<void> {
    // Check permission before attempting to schedule
    const hasPermission = await this.checkAndRequestPermission();
    
    if (!hasPermission) {
      console.warn('Cannot schedule notification: permission not granted');
      // Show fallback notification in browser
      this.showBrowserNotification(title, body, 'task');
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
      
      // Check for custom sound
      const hasCustomTaskSound = CustomAudioService.hasCustomAudio('task');
      const customTaskSoundName = localStorage.getItem('customTaskSoundName');
      
      // Determine sound and channel to use
      let soundToUse: string | undefined;
      let channelId = 'task-notifications';
      
      if (useUrgentStyle) {
        soundToUse = 'urgent.wav';
        channelId = 'urgent-notifications';
      } else if (hasCustomTaskSound) {
        // Use silent channel for custom sounds (will play programmatically)
        soundToUse = undefined; // No sound in notification itself
        channelId = 'custom-task-notifications';
      } else {
        // Use default sound from channel
        soundToUse = 'beep.wav';
        channelId = 'task-notifications';
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
            channelId: channelId,
            autoCancel: !useUrgentStyle, // Urgent notifications require manual dismissal
            ongoing: useUrgentStyle, // Keep urgent notifications visible
            priority: useUrgentStyle ? 2 : 1, // Max priority for urgent
            visibility: 1, // Show on lock screen
            vibrate: true, // Enable vibration
            wakeUpScreen: true, // Wake up screen for notifications
            actionTypeId: "OPEN_APP", // Default action opens app
            extra: {
              taskId: taskId,
              isUrgent: useUrgentStyle,
              customSound: hasCustomTaskSound ? customTaskSoundName : null,
              hasCustomSound: hasCustomTaskSound,
              notificationType: 'task' // Ensure type is set for custom sound playback
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
      console.error('Error scheduling task notification:', error);
      
      // Fallback to browser notification with custom sound
      if (!Capacitor.isNativePlatform()) {
        console.log('Falling back to browser notification with custom sound');
        setTimeout(async () => {
          await this.showBrowserNotification(title, body, 'task');
          this.triggerVibration('task');
        }, Math.max(0, notificationTime.getTime() - Date.now()));
        return true;
      }
      
      toast({
        title: "Failed to schedule notification",
        description: "There was an error scheduling your task notification.",
        variant: "destructive"
      });
      return false;
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

  // Helper method to get custom sound URI for notifications
  private async getCustomSoundUri(type: 'timer' | 'task'): Promise<string | null> {
    try {
      if (!Capacitor.isNativePlatform()) return null;
      
      const fileName = localStorage.getItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}SoundFile`);
      if (!fileName) return null;

      // Try different directories to find accessible file
      const directories = [Directory.External, Directory.Documents, Directory.Cache];
      
      for (const directory of directories) {
        try {
          const uri = await Filesystem.getUri({
            directory,
            path: fileName
          });
          console.log(`Found custom ${type} sound at: ${uri.uri}`);
          return uri.uri;
        } catch (error) {
          continue; // Try next directory
        }
      }
      
      console.warn(`Custom ${type} sound file not found in accessible directories`);
      return null;
    } catch (error) {
      console.error(`Error getting custom sound URI for ${type}:`, error);
      return null;
    }
  }

  private async showBrowserNotification(title: string, body: string, type?: 'timer' | 'task') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(title, body, type);
        }
      });
    }

    // Play custom sound if available
    if (type) {
      await this.playCustomSound(type);
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
      this.triggerVibration('urgent');
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
    
    // Check for custom timer sound
    const hasCustomSound = CustomAudioService.hasCustomAudio('timer');
    const customTimerSoundName = localStorage.getItem('customTimerSoundName');
    
    // Determine sound and channel to use
    let soundToUse: string | undefined;
    let channelId = 'timer-notifications';
    
    if (hasCustomSound) {
      // Use silent channel for custom sounds (will play programmatically)
      soundToUse = undefined; // No sound in notification itself
      channelId = 'custom-timer-notifications';
    } else {
      // Use default sound from channel
      soundToUse = 'timer-complete.mp3';
      channelId = 'timer-notifications';
    }
    
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
            sound: soundToUse,
            smallIcon: 'ic_stat_focus_brain',
            iconColor: '#8B5CF6',
            channelId: channelId,
            autoCancel: true,
            ongoing: false,
            vibrate: true, // Enable vibration
            wakeUpScreen: true, // Wake up screen for notifications
            actionTypeId: "OPEN_APP", // Default action opens app
            extra: {
              customSound: hasCustomSound ? customTimerSoundName : null,
              hasCustomSound: hasCustomSound,
              hasVibration: true,
              notificationType: 'timer'
            }
          }
        ]
      });
      
      console.log(`Timer notification scheduled at ${scheduledTime.toISOString()}`);
      
      // Trigger immediate vibration for confirmation
      this.triggerVibration('timer');
      
      return true;
    } catch (error) {
      console.error('Error scheduling timer notification:', error);
      
      // Fallback to browser notification with custom sound
      if (!Capacitor.isNativePlatform()) {
        console.log('Falling back to browser notification with custom sound');
        setTimeout(async () => {
          await this.showBrowserNotification(title, body, 'timer');
          this.triggerVibration('timer');
        }, Math.max(0, scheduledTime.getTime() - Date.now()));
        return true;
      }
      
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

  // Initialize custom audio service
  private async initializeCustomAudio() {
    try {
      await CustomAudioService.initializeAudioDirectory();
      console.log('Custom audio service initialized');
    } catch (error) {
      console.error('Error initializing custom audio service:', error);
    }
  }

  // Setup enhanced background notification delivery
  private async setupBackgroundDelivery() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Request battery optimization exemption for reliable background notifications
        console.log('Setting up background notification delivery');
        
        // Ensure the app has permission to run in background
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            // App is now in foreground, check for missed notifications
            this.handleAppResume();
          }
        });
        
      } catch (error) {
        console.error('Error setting up background delivery:', error);
      }
    }
  }

  // Handle app resume to play missed custom sounds
  private async handleAppResume() {
    try {
      // Check for any pending notifications that might have custom sounds
      const pending = await LocalNotifications.getPending();
      console.log('App resumed, checking for pending notifications:', pending.notifications.length);
    } catch (error) {
      console.error('Error handling app resume:', error);
    }
  }

  // Enhanced vibration patterns for different notification types
  private async triggerVibration(type: 'task' | 'timer' | 'urgent') {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Haptics')) {
        // Use Capacitor Haptics for native platforms
        switch (type) {
          case 'urgent':
            // Strong, repeated vibration for urgent notifications
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 400);
            break;
          case 'timer':
            // Medium vibration for timer completion
            await Haptics.impact({ style: ImpactStyle.Medium });
            setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 100);
            break;
          case 'task':
            // Light vibration for task notifications
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
        }
      } else if ('vibrate' in navigator) {
        // Fallback to Web Vibration API
        switch (type) {
          case 'urgent':
            navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
            break;
          case 'timer':
            navigator.vibrate([300, 100, 300]);
            break;
          case 'task':
            navigator.vibrate([150]);
            break;
        }
      }
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }


  // Remove custom sound
  async removeCustomSound(type: 'timer' | 'task'): Promise<boolean> {
    try {
      const success = await CustomAudioService.removeCustomAudio(type);
      
      if (success) {
        // Reset to default channels
        await this.initializeChannels();
        
        toast({
          title: 'Custom Sound Removed',
          description: `${type} notifications will use the default sound`,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error removing ${type} custom sound:`, error);
      return false;
    }
  }

  

  // Play custom sound with enhanced mobile support
  private async playCustomSound(type: 'timer' | 'task'): Promise<void> {
    try {
      // Always trigger vibration first for immediate feedback
      if (Capacitor.isNativePlatform()) {
        await this.triggerVibration(type);
      }

      const audioUrl = await CustomAudioService.getAudioUrl(type);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.volume = 1.0; // Max volume for notifications
        await audio.play();
        console.log(`Playing custom ${type} sound`);
      } else {
        // Fallback to default sound
        this.playDefaultSound(type);
      }
    } catch (error) {
      console.error(`Error playing custom ${type} sound:`, error);
      this.playDefaultSound(type);
    }
  }

  // Play default notification sound
  private playDefaultSound(type: 'timer' | 'task'): void {
    try {
      const soundFile = type === 'timer' ? '/sounds/timer-complete.mp3' : '/sounds/beep.wav';
      const audio = new Audio(soundFile);
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Could not play default sound:', e));
    } catch (error) {
      console.error('Error playing default sound:', error);
    }
  }

  // Public: preview custom sound immediately with vibration (no scheduling)
  public async previewCustomSound(type: 'timer' | 'task'): Promise<void> {
    try {
      await this.playCustomSound(type);
      toast({
        title: 'Preview',
        description: `Playing ${type} sound with vibration`,
      });
    } catch (error) {
      console.error(`Error previewing custom ${type} sound:`, error);
      toast({
        title: 'Preview failed',
        description: 'Could not play sound',
        variant: 'destructive'
      });
    }
  }

  // Test custom notification
  async testCustomNotification(type: 'timer' | 'task'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Immediate test for web platform
      toast({
        title: 'Testing Custom Sound',
        description: `Testing ${type} notification sound...`,
      });
      
      // Play custom sound immediately
      await this.playCustomSound(type);
      this.triggerVibration(type);
      
      // Show browser notification
      setTimeout(async () => {
        await this.showBrowserNotification(
          `Test Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Sound`,
          `This is a test of your custom ${type} notification`,
          type
        );
      }, 500);
      
      return;
    }

    // Native platform test
    const testTime = new Date(Date.now() + 2000); // 2 seconds from now
    
    if (type === 'timer') {
      await this.scheduleTimerNotification(
        'Test Custom Timer Sound',
        'This is a test of your custom timer notification',
        testTime
      );
    } else {
      await this.scheduleTaskNotification(
        'test-custom-task',
        'Test Custom Task Sound',
        'This is a test of your custom task notification',
        testTime,
        false
      );
    }
  }
}

export default new NotificationService();
