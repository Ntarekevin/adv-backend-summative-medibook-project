const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const SLOT_MINUTES = 30;
const MAX_PER_DAY = 12;

function parseAppointmentDate(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  const sqlDateTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(input);
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/i.test(input);
  if (!sqlDateTime && !isoDateTime) return null;

  const date = new Date(sqlDateTime ? input.replace(' ', 'T') : input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinWorkingHours(date) {
  if (!(date instanceof Date) || isNaN(date)) return false;
  const h = date.getHours();
  const m = date.getMinutes();
  const minutes = h * 60 + m;
  return minutes >= WORK_START_HOUR * 60 && minutes < WORK_END_HOUR * 60;
}

function isOnSlotBoundary(date) {
  if (!(date instanceof Date) || isNaN(date)) return false;
  return date.getMinutes() % SLOT_MINUTES === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

function isInFuture(date, now = new Date()) {
  if (!(date instanceof Date) || isNaN(date)) return false;
  return date.getTime() > now.getTime();
}

function validateBookingSlot(date, now = new Date()) {
  if (!(date instanceof Date) || isNaN(date)) return { ok: false, reason: 'Invalid date' };
  if (!isInFuture(date, now)) return { ok: false, reason: 'Appointment must be in the future' };
  if (!isWithinWorkingHours(date)) return { ok: false, reason: 'Outside working hours (09:00–17:00)' };
  if (!isOnSlotBoundary(date)) return { ok: false, reason: 'Time must be on a 30-minute boundary' };
  return { ok: true };
}

module.exports = {
  parseAppointmentDate, isWithinWorkingHours, isOnSlotBoundary, isInFuture, validateBookingSlot,
  WORK_START_HOUR, WORK_END_HOUR, SLOT_MINUTES, MAX_PER_DAY,
};