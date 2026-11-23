const pool = require('../config/db');
const Appointment = require('../models/appointmentModel');
const { calculateRefund } = require('../services/refundService');
const audit = require('../services/auditLogger');
const queue = require('../services/queueService');
const { NotFoundError, UnprocessableError } = require('../utils/errors');

async function cancel(req, res, next) {
  try {
    const id = req.params.id;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = await Appointment.findById(id, conn);
      if (!row) throw new NotFoundError('Appointment not found');
      if (row.status === 'cancelled') throw new UnprocessableError('Appointment already cancelled');

      const refund = calculateRefund(row.amount_paid, row.appt_datetime, new Date());
      const ok = await Appointment.markCancelled(id, refund, conn);
      if (!ok) throw new UnprocessableError('Unable to cancel');
      await conn.commit();

      await audit.log({
        event: 'cancellation',
        appointment_id: Number(id),
        refund_amount: refund,
      });

      try {
        await queue.pushNotification({
          type: 'slot_freed',
          doctor_id: row.doctor_id,
          appt_datetime: row.appt_datetime,
        });
      } catch (error) {
        console.error('Notification queue error:', error.message);
      }

      res.json({ appointment_id: Number(id), refund_amount: refund, status: 'cancelled' });
    } catch (e) {
      try { await conn.rollback(); } catch (_) {}
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) { next(e); }
}

module.exports = { cancel };
