import { selectChannelId, normalizeTimestamp } from '../../src/services/notificationHelpers.js';

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg} expected=${expected} actual=${actual}`);
  }
}

// selectChannelId tests
assertEqual(selectChannelId('alarm'), 'alarms', 'alarm -> alarms');
assertEqual(selectChannelId('critical'), 'critical', 'critical -> critical');
assertEqual(selectChannelId('other'), 'reminders', 'fallback -> reminders');

// normalizeTimestamp tests
const now = Date.now();
const inPast = now - 10000;
const fixed = normalizeTimestamp(inPast);
if (fixed <= now) throw new Error('normalizeTimestamp should push to the near future');
const exact = normalizeTimestamp(now + 60000);
if (exact < now + 59000) throw new Error('normalizeTimestamp should preserve future ts');

console.log('notificationHelpers tests passed');


