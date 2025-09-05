Manual QA Checklist

Android
- [ ] Schedule local reminder; terminate app; notification fires at scheduled time; vibration pattern matches channel.
- [ ] Receive FCM push while app terminated; shows notification on reminders channel; vibrates.
- [ ] Reboot device; previously scheduled reminders still fire (rescheduled or persisted by OS).
- [ ] Background handler displays Notifee notification for data push.
- [ ] Open settings via in-app link; per-channel visibility.

iOS
- [ ] Schedule local reminder while app active; notification with sound; foreground haptic triggered.
- [ ] Receive FCM→APNs push; alert displays when locked/terminated.
- [ ] With >64 pending reminders: only next N scheduled; overflow rescheduled on app launch.

Cross-platform
- [ ] First-run permission flow prompts.
- [ ] Analytics events logged for sent/received/opened/failed.
- [ ] Battery optimization guidance shown (Android vendors).


