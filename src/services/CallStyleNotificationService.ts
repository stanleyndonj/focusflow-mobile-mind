import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

// Haptics import with error handling
let Haptics: any = null;
let ImpactStyle: any = null;
try {
  const hapticModule = require('@capacitor/haptics');
  Haptics = hapticModule.Haptics;
  ImpactStyle = hapticModule.ImpactStyle;
} catch (error) {
  // Haptics not available, will handle gracefully
}

interface CallStyleNotification {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'urgent' | 'critical';
  soundFile?: string;
  vibrationPattern?: number[];
  onDismiss?: () => void;
  onSnooze?: () => void;
  autoSnoozeMinutes?: number;
}

class CallStyleNotificationService {
  private activeNotifications: Map<string, CallStyleNotification> = new Map();
  private soundInterval: NodeJS.Timeout | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private defaultRingtone: string = '/assets/sounds/urgent-ringtone.mp3';
  private customRingtone: string | null = null;

  constructor() {
    this.loadSettings();
    this.setupNotificationListeners();
  }

  // Load settings from localStorage
  private loadSettings() {
    try {
      const settings = localStorage.getItem('focusflow_notification_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isEnabled = parsed.callStyleEnabled ?? false;
        this.customRingtone = parsed.customRingtone ?? null;
      }
    } catch (error) {
      console.warn('Error loading notification settings:', error);
    }
  }

  // Save settings to localStorage
  private saveSettings() {
    try {
      const settings = {
        callStyleEnabled: this.isEnabled,
        customRingtone: this.customRingtone
      };
      localStorage.setItem('focusflow_notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Error saving notification settings:', error);
    }
  }

  // Setup notification listeners
  private setupNotificationListeners() {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        this.handleNotificationAction(notification);
      });

      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        this.handleNotificationReceived(notification);
      });
    }
  }

  // Handle notification actions
  private handleNotificationAction(notification: any) {
    const notificationId = notification.notification.id.toString();
    const activeNotif = this.activeNotifications.get(notificationId);

    if (activeNotif) {
      if (notification.actionId === 'dismiss') {
        this.dismissNotification(notificationId);
        activeNotif.onDismiss?.();
      } else if (notification.actionId === 'snooze') {
        this.snoozeNotification(notificationId, activeNotif.autoSnoozeMinutes || 5);
        activeNotif.onSnooze?.();
      }
    }
  }

  // Handle notification received
  private handleNotificationReceived(notification: any) {
    if (this.isEnabled) {
      const notificationId = notification.id.toString();
      this.startContinuousAlerts(notificationId);
    }
  }

  // Enable/disable call-style notifications
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.stopAllAlerts();
    }
  }

  // Set custom ringtone
  setCustomRingtone(soundPath: string | null) {
    this.customRingtone = soundPath;
    this.saveSettings();
  }

  // Get current ringtone
  getCurrentRingtone(): string {
    return this.customRingtone || this.defaultRingtone;
  }

  // Schedule call-style notification
  async scheduleCallStyleNotification(notification: CallStyleNotification): Promise<void> {
    if (!this.isEnabled) {
      console.log('Call-style notifications are disabled');
      return;
    }

    try {
      // Store active notification
      this.activeNotifications.set(notification.id, notification);

      // Get sound file
      const soundName = this.getCurrentRingtone().split('/').pop()?.split('.')[0] || 'urgent-ringtone';

      // Schedule native notification
      if (Capacitor.isNativePlatform()) {
        const scheduleOptions: ScheduleOptions = {
          notifications: [{
            id: parseInt(notification.id.replace(/\D/g, '')) || 1,
            title: notification.title,
            body: notification.message,
            schedule: { at: new Date() },
            sound: soundName,
            // priority: notification.priority === 'critical' ? 5 : notification.priority === 'urgent' ? 4 : 3, // Removed - not supported
            ongoing: true, // Makes notification persistent
            actions: [
              {
                id: 'dismiss',
                title: 'Dismiss',
                destructive: true
              },
              {
                id: 'snooze',
                title: `Snooze ${notification.autoSnoozeMinutes || 5}m`
              }
            ],
            extra: {
              callStyle: true,
              priority: notification.priority
            }
          }]
        };

        await LocalNotifications.schedule(scheduleOptions);
        console.log(`✅ Call-style notification scheduled: ${notification.title}`);
        
        // Start continuous alerts for critical notifications
        if (notification.priority === 'critical') {
          this.startContinuousAlerts(notification.id);
        }
      } else {
        // Web fallback with persistent banner
        this.showWebCallStyleNotification(notification);
      }

    } catch (error) {
      console.error('Error scheduling call-style notification:', error);
      throw error;
    }
  }

  // Start continuous sound and vibration alerts
  private startContinuousAlerts(notificationId: string) {
    if (!this.isEnabled) return;

    this.stopAllAlerts(); // Stop any existing alerts

    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return;

    // Continuous sound alerts
    if (Capacitor.isNativePlatform()) {
      // Native platform - use Haptics for vibration
      this.vibrationInterval = setInterval(async () => {
        try {
          if (Haptics && ImpactStyle) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          }
        } catch (error) {
          console.warn('Haptics not available:', error);
        }
      }, 1000) as any; // Vibrate every second
    } else {
      // Web platform - continuous audio
      this.playContinuousWebAudio();
    }

    console.log(`🔔 Started continuous alerts for: ${notification.title}`);
  }

  // Play continuous web audio
  private playContinuousWebAudio() {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create ringtone-like pattern
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);

    // Repeat every 2 seconds
    this.soundInterval = setTimeout(() => {
      if (this.soundInterval) {
        this.playContinuousWebAudio();
      }
    }, 2000) as any;
  }

  // Show web call-style notification banner
  private showWebCallStyleNotification(notification: CallStyleNotification) {
    // Remove existing banner
    const existingBanner = document.getElementById('call-style-notification-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Create persistent banner
    const banner = document.createElement('div');
    banner.id = 'call-style-notification-banner';
    banner.className = 'call-style-notification-banner';
    banner.innerHTML = `
      <div class="call-notification-content">
        <div class="call-notification-icon">📞</div>
        <div class="call-notification-text">
          <div class="call-notification-title">${notification.title}</div>
          <div class="call-notification-message">${notification.message}</div>
        </div>
        <div class="call-notification-actions">
          <button class="call-notification-snooze">Snooze</button>
          <button class="call-notification-dismiss">Dismiss</button>
        </div>
      </div>
    `;

    // Style the banner
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out, pulse 2s infinite;
    `;

    // Add CSS animations
    if (!document.querySelector('#call-style-animations')) {
      const style = document.createElement('style');
      style.id = 'call-style-animations';
      style.textContent = `
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        .call-notification-content { display: flex; align-items: center; gap: 12px; }
        .call-notification-icon { font-size: 24px; animation: bounce 1s infinite; }
        .call-notification-text { flex: 1; }
        .call-notification-title { font-weight: bold; font-size: 16px; }
        .call-notification-message { font-size: 14px; opacity: 0.9; margin-top: 2px; }
        .call-notification-actions { display: flex; gap: 8px; }
        .call-notification-snooze, .call-notification-dismiss {
          padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;
        }
        .call-notification-snooze { background: rgba(255,255,255,0.2); color: white; }
        .call-notification-dismiss { background: white; color: #333; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
      `;
      document.head.appendChild(style);
    }

    // Add event listeners
    banner.querySelector('.call-notification-dismiss')?.addEventListener('click', () => {
      this.dismissNotification(notification.id);
      notification.onDismiss?.();
    });

    banner.querySelector('.call-notification-snooze')?.addEventListener('click', () => {
      this.snoozeNotification(notification.id, notification.autoSnoozeMinutes || 5);
      notification.onSnooze?.();
    });

    document.body.appendChild(banner);

    // Start continuous alerts
    this.startContinuousAlerts(notification.id);
  }

  // Dismiss notification
  dismissNotification(notificationId: string) {
    this.activeNotifications.delete(notificationId);
    this.stopAllAlerts();

    // Remove native notification
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.cancel({ notifications: [{ id: parseInt(notificationId) || 1 }] });
    }

    // Remove web banner
    const banner = document.getElementById('call-style-notification-banner');
    if (banner) {
      banner.style.animation = 'slideUp 0.3s ease-in forwards';
      setTimeout(() => banner.remove(), 300);
    }

    console.log(`✅ Dismissed call-style notification: ${notificationId}`);
  }

  // Snooze notification
  snoozeNotification(notificationId: string, minutes: number) {
    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return;

    this.dismissNotification(notificationId);

    // Reschedule for later
    setTimeout(() => {
      this.scheduleCallStyleNotification(notification);
    }, minutes * 60 * 1000);

    console.log(`⏰ Snoozed notification for ${minutes} minutes: ${notification.title}`);
  }

  // Stop all alerts
  private stopAllAlerts() {
    if (this.soundInterval) {
      clearTimeout(this.soundInterval);
      this.soundInterval = null;
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
  }

  // Get settings
  getSettings() {
    return {
      enabled: this.isEnabled,
      customRingtone: this.customRingtone,
      defaultRingtone: this.defaultRingtone
    };
  }

  // Cleanup
  destroy() {
    this.stopAllAlerts();
    this.activeNotifications.clear();
  }
}

// Singleton instance
const callStyleNotificationService = new CallStyleNotificationService();

export default callStyleNotificationService;
export type { CallStyleNotification };
