const redis = require('../config/redis');

const WAITLIST_KEY = 'medibook:waitlist';
const NOTIF_KEY = 'medibook:notifications';

async function pushWaitlist(entry) {
  await redis.rpush(WAITLIST_KEY, JSON.stringify(entry));
}

async function popWaitlist() {
  const raw = await redis.lpop(WAITLIST_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function pushNotification(entry) {
  await redis.rpush(NOTIF_KEY, JSON.stringify(entry));
}

async function popNotification() {
  const raw = await redis.lpop(NOTIF_KEY);
  return raw ? JSON.parse(raw) : null;
}

module.exports = { pushWaitlist, popWaitlist, pushNotification, popNotification };