/**
 * Separate worker process: `npm run worker`
 *  - processes notification queue -> writes messages to audit log
 *  - processes waitlist: when a slot is freed, tries to promote first waitlister.
 *    If promotion fails, the waitlister is re-queued (never lost).
 */
const redis = require('../config/redis');
const pool = require('../config/db');
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
const audit = require('../services/auditLogger');
const { validateBookingSlot, MAX_PER_DAY } = require('../services/validationService');
const { acquireDoctorDayLock } = require('../services/bookingLock');

const NOTIF_KEY = 'medibook:notifications';
const WAIT_KEY = 'medibook:waitlist';

async function processNotification() {
  const raw = await redis.lpop(NOTIF_KEY);
  if (!raw) return;
  const job = JSON.parse(raw);
  if (job.type === 'booking_confirmation') {
    await audit.log({ event: 'notification', channel: 'email', message: `Appointment ${job.appointment_id} confirmed for ${job.patient_email}` });
  } else if (job.type === 'slot_freed') {
    await tryPromoteWaitlister(job);
  } else {
    await audit.log({ event: 'notification', job });
  }
}

async function tryPromoteWaitlister(job) {
  // Peek waitlist for a matching (doctor+datetime) slot
  const len = await redis.llen(WAIT_KEY);
  if (!len) return;
  const entries = await redis.lrange(WAIT_KEY, 0, len - 1);

  for (let i = 0; i < entries.length; i++) {
    const entry = JSON.parse(entries[i]);
    if (String(entry.doctor_id) !== String(job.doctor_id)) continue;
    // Match the exact date and time that was freed.
    if (!entry.appt_datetime || entry.appt_datetime !== job.appt_datetime) continue;

    // pop this exact element from the list atomically-ish
    const removed = await redis.lrem(WAIT_KEY, 1, entries[i]);
    if (!removed) continue;

    const conn = await pool.getConnection();
    let releaseDayLock;
    try {
      await conn.beginTransaction();
      const date = entry.appt_datetime.slice(0, 10);
      releaseDayLock = await acquireDoctorDayLock(conn, entry.doctor_id, date);
      const onDay = await Appointment.countDoctorBookingsOnDay(
        entry.doctor_id,
        date,
        conn
      );
      if (onDay >= MAX_PER_DAY) throw new Error('Doctor fully booked for this day');

      const check = validateBookingSlot(new Date(entry.appt_datetime.replace(' ', 'T')));
      if (!check.ok) throw new Error(check.reason);
      const doctor = await Doctor.findById(entry.doctor_id);
      if (!doctor) throw new Error('Doctor not found');
      const existing = await Appointment.findBySlot(entry.doctor_id, entry.appt_datetime, conn);
      if (existing) throw new Error('Slot already booked');

      await Appointment.create({
        patient_id: entry.patient_id,
        doctor_id: entry.doctor_id,
        appt_datetime: entry.appt_datetime,
        amount_paid: doctor.consultation_fee,
      }, conn);
      await conn.commit();
      await audit.log({ event: 'waitlist_promoted', entry });
    } catch (err) {
      let reason = err.message;
      try { await conn.rollback(); }
      catch (rollbackError) {
        reason = `${reason}; rollback failed: ${rollbackError.message}`;
        console.error('[worker] rollback error:', rollbackError.message);
      }
      // NEVER lose the patient — re-queue them
      await redis.rpush(WAIT_KEY, entries[i]);
      await audit.log({ event: 'waitlist_promotion_failed', entry, reason });
    } finally {
      try {
        if (releaseDayLock) await releaseDayLock();
      } finally {
        conn.release();
      }
    }
    return;
  }
}

async function loop() {
  console.log('[worker] started');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try { await processNotification(); }
    catch (e) { console.error('[worker] error:', e.message); }
    await new Promise(r => setTimeout(r, 1000));
  }
}
loop();