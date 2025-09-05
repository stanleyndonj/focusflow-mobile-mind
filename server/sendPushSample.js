// Sample FCM HTTP v1 sender
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json NODE_ENV=staging node server/sendPushSample.js <FCM_TOKEN>
import { google } from 'googleapis';
import fetch from 'node-fetch';

const PROJECT_ID = process.env.GCLOUD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!PROJECT_ID) {
  console.error('Set GCLOUD_PROJECT_ID or FIREBASE_PROJECT_ID');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({ scopes: SCOPES });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function sendMessage(token) {
  const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
  const accessToken = await getAccessToken();
  const payload = {
    message: {
      token,
      android: {
        priority: 'high',
        notification: {
          title: 'Reminder',
          body: 'Time to run your task',
          channel_id: 'reminders',
        },
      },
      apns: {
        headers: { 'apns-push-type': 'alert', 'apns-priority': '10' },
        payload: {
          aps: { alert: { title: 'Reminder', body: 'Time to run your task' }, sound: 'default', badge: 1 },
        },
      },
      data: { taskId: '123', type: 'reminder' },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(res.status, text);
}

const tokenArg = process.argv[2];
if (!tokenArg) {
  console.error('Usage: node server/sendPushSample.js <FCM_TOKEN>');
  process.exit(1);
}

sendMessage(tokenArg).catch(err => {
  console.error(err);
  process.exit(1);
});


