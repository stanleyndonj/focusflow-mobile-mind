
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focustask.app',
  appName: 'FocusTask',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allow cleartext connections for debugging
  },
  // Capacitor plugin configuration
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_focus_brain",
      iconColor: "#8B5CF6",
      sound: true, // Enable sounds
      // Enhanced background notification support
      schedule: {
        allowWhileIdle: true,
        exact: true // Request exact timing
      },
      channelDefaults: {
        importance: 5, // Max importance for reliable delivery
        visibility: 1, // Public - show on lock screen
        vibration: true,
        lights: true,
        enableVibration: true,
        enableLights: true
      },
      // Request background permission and battery optimization exemption
      requestPermissions: true,
      requestExactAlarm: true
    },
    // Allow for app state management
    App: {
      backgroundColor: "#8B5CF6",
      webDir: "dist"
    },
    // Register our custom AppBlocker plugin
    AppBlocker: {
      blockedAppsAutoRestart: true
    }
  },
  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: null,
      keystorePassword: null,
      keystoreAlias: null,
      keystoreAliasPassword: null,
      releaseType: "APK"
    },
    iconBackground: "#8B5CF6", // Purple background for adaptive icons
    backgroundColor: "#8B5CF6", // App background color
    icon: "resources/icon", // Focus brain icon
    // Define custom notification icons
    icons: [
      {
        name: "ic_stat_focus_brain",
        folder: "resources/notifications",
        scale: ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
      }
    ],
    // Enhanced permissions for reliable background notifications
    permissions: [
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
      "android.permission.WAKE_LOCK",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.ACCESS_NOTIFICATION_POLICY",
      "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE"
    ]
  },
  // Make sure background task handling is enabled for iOS
  ios: {
    contentInset: "always"
  }
};

export default config;
