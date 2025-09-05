export function selectChannelId(type) {
  if (type === 'alarm') return 'alarms';
  if (type === 'critical') return 'critical';
  return 'reminders';
}

export function normalizeTimestamp(date) {
  const ts = date instanceof Date ? date.getTime() : Number(date);
  const minTs = Date.now() + 1000;
  return Math.max(ts, minTs);
}


