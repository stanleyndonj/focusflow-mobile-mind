AndroidManifest.xml additions (RN project)

<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<application>
  <!-- FCM messaging service -->
  <service
    android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
      <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
  </service>

  <!-- Boot receiver to reschedule reminders (implement a small BroadcastReceiver in RN/Native if needed) -->
  <receiver
    android:name=".BootReceiver"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
      <action android:name="android.intent.action.BOOT_COMPLETED" />
      <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
    </intent-filter>
  </receiver>
</application>

Note: BootReceiver should trigger JS headless task or a native reschedule to recreate Notifee trigger notifications.


