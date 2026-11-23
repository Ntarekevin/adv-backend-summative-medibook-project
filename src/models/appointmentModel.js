const pool = require('../config/db');

async function create({ patient_id, doctor_id, appt_datetime, amount_paid }, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid)
     VALUES (?, ?, ?, ?)`,
    [patient_id, doctor_id, appt_datetime, amount_paid]
  );
  return result.insertId;
}

async function findById(id, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT * FROM appointments WHERE appointment_id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findBySlot(doctorId, apptDatetime, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT * FROM appointments
     WHERE doctor_id = ? AND active_slot = ?`,
    [doctorId, apptDatetime]
  );
  return rows[0] || null;
}

async function countDoctorBookingsOnDay(doctorId, date, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT COUNT(*) AS booked_count
     FROM appointments
     WHERE doctor_id = ? AND status = 'booked'
       AND appt_datetime >= ? AND appt_datetime < DATE_ADD(?, INTERVAL 1 DAY)`,
    [doctorId, date, date]
  );
  return Number(rows[0].booked_count);
}

async function markCancelled(id, refundAmount, executor = pool) {
  const [result] = await executor.execute(
    `UPDATE appointments
     SET status = 'cancelled', refund_amount = ?, cancelled_at = NOW()
     WHERE appointment_id = ? AND status = 'booked'`,
    [refundAmount, id]
  );
  return result.affectedRows > 0;
}

async function findByPatient(patientId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appt_datetime',
    [patientId]
  );
  return rows;
}

module.exports = {
  create,
  findById,
  findBySlot,
  countDoctorBookingsOnDay,
  markCancelled,
  findByPatient,
};