Notification design: RN + Notifee + FCM/APNs

Overview
- Local-first: schedule reminders locally via Notifee (Android uses AlarmManager under the hood); use FCM/APNs as fallback/sync.
- Android: channels with custom vibration patterns; user can change channel settings. Once created, vibration is user-controlled.
- iOS: cannot enforce custom vibration from push; uses system haptics settings. ~64 scheduled local notification limit; we keep next N and reschedule overflow when app runs.

Pipeline
- Server → FCM HTTP v1 → Android device; FCM → APNs → iOS device.
- Client registers FCM token; server stores token per user; data/notification payload.
- Background handler (Android) displays via Notifee when data push arrives.

Channels
- reminders: vibration [300,200,300]
- alarms: [500,200,500,200,700]
- critical: [700,200,700,200,1000] (document that Critical Alerts on iOS require Apple entitlement; not enabled by default).

Permissions & UX
- Prompt users for notifications; show screen explaining haptics and battery optimization steps (Xiaomi/Huawei/Samsung).
- Provide deep-links to OS notification settings and per-channel settings.

Resilience
- On Android, rescheduling survives reboot via AlarmManager/WorkManager; implement RECEIVE_BOOT_COMPLETED and reschedule.
- On iOS, store overflow locally and reschedule on app launch to respect 64 limit.

Analytics
- Log notification_sent/scheduled/received/opened/failed to Firebase Analytics; export script aggregates delivered vs sent.

Limitations
- Android: channel vibration is user-controlled post-creation; if disabled, show in-app guidance.
- iOS: custom vibration not possible from push; can request Critical Alerts entitlement for specific use cases only.


