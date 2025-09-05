# Notifications (RN + Notifee) — Setup & Runbook

## Dependencies
- @react-native-firebase/messaging
- @react-native-firebase/analytics
- @notifee/react-native

## App wiring
1. Call `NotificationService.initialize()` at app startup (e.g., in index.js or App.js).
2. Import `src/services/backgroundMessaging.js` in index.js to register the background handler.
3. Fetch FCM token via `NotificationService.getFcmToken()` and POST to your server. Subscribe to `onTokenRefresh`.
4. Android: apply `docs/android-manifest-diff.md` and add a BootReceiver or headless rescheduler.
5. iOS: enable Remote Notifications capability and APNs. For Critical Alerts, apply for entitlement (not enabled by default).

## Server sample (FCM HTTP v1)
```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
export GCLOUD_PROJECT_ID=<project-id>
node server/sendPushSample.js <FCM_DEVICE_TOKEN>
```

## Env
See `docs/example.env`. Do not commit secrets.

## Analytics events
- notification_sent { origin, channelId, hasData }
- notification_scheduled { channelId, when }
- notification_received { origin, id }
- notification_opened { id }
- notification_failed { stage, message }

## Testing
- Follow `tests/notification-manual-checklist.md` and `tests/device-matrix.md`.
- Export metrics: `node server/exportMetrics.js analytics-events.json` (demo placeholder).

## iOS Constraints
- Custom vibration patterns cannot be forced; rely on user settings.
- iOS stores ~64 pending local notifications; we keep next N and reschedule overflow.

## Android Channels
- Vibration patterns defined on channel creation. Users can change channel behavior later in OS settings; provide in-app links to channel settings.
