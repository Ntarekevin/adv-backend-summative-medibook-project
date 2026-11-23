const pool = require('../config/db');

async function create({ full_name, specialty, consultation_fee, room }) {
  const [r] = await pool.execute(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [full_name, specialty, consultation_fee, room]
  );
  return findById(r.insertId);
}
async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM doctors WHERE doctor_id = ?', [id]);
  return rows[0] || null;
}
async function findAll() {
  const [rows] = await pool.execute('SELECT * FROM doctors ORDER BY doctor_id');
  return rows;
}
async function update(id, { full_name, specialty, consultation_fee, room }) {
  const [r] = await pool.execute(
    'UPDATE doctors SET full_name=?, specialty=?, consultation_fee=?, room=? WHERE doctor_id=?',
    [full_name, specialty, consultation_fee, room, id]
  );
  return r.affectedRows ? findById(id) : null;
}
async function remove(id) {
  const [r] = await pool.execute('DELETE FROM doctors WHERE doctor_id=?', [id]);
  return r.affectedRows > 0;
}

// ---- Advanced SQL reports (all computed in SQL) ----

async function reportAllDoctors() {
  const [rows] = await pool.execute(
    `SELECT d.doctor_id, d.full_name, d.specialty, d.room,
            COUNT(a.appointment_id) AS total_appointments,
            COALESCE(SUM(CASE WHEN a.status='booked' THEN a.amount_paid - a.refund_amount ELSE 0 END), 0) AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.doctor_id
     GROUP BY d.doctor_id, d.full_name, d.specialty, d.room
     ORDER BY d.doctor_id`
  );
  return rows;
}

async function busyDays() {
  // Cancelled appointments are excluded because this measures current utilization.
  // >80% of 12-slot capacity = > 9.6 slots = >= 10
  const [rows] = await pool.execute(
    `SELECT doctor_id, DATE(appt_datetime) AS day, COUNT(*) AS booked_count,
            ROUND(COUNT(*) / 12 * 100, 2) AS utilization_pct
     FROM appointments
     WHERE status = 'booked'
     GROUP BY doctor_id, DATE(appt_datetime)
     HAVING COUNT(*) > 12 * 0.8
     ORDER BY doctor_id, day`
  );
  return rows;
}

async function statistics(doctorId) {
  const [revenueRows] = await pool.execute(
    `SELECT COALESCE(SUM(amount_paid - refund_amount),0) AS revenue,
            COUNT(CASE WHEN status='booked' AND appt_datetime >= NOW() THEN 1 END) AS upcoming
     FROM appointments WHERE doctor_id = ?`, [doctorId]
  );
  const [perDay] = await pool.execute(
    `SELECT DATE(appt_datetime) AS day, COUNT(*) AS booked
     FROM appointments
     WHERE doctor_id = ? AND status='booked'
       AND appt_datetime >= CURDATE() AND appt_datetime < DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DATE(appt_datetime)
     ORDER BY day`, [doctorId]
  );
  const [utilPerDay] = await pool.execute(
     `SELECT DATE(appt_datetime) AS day, COUNT(*) AS booked,
             ROUND(COUNT(*) / 12 * 100, 2) AS utilization_pct
      FROM appointments
      WHERE doctor_id = ? AND status='booked'
        AND appt_datetime >= CURDATE()
        AND appt_datetime < DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(appt_datetime)
      ORDER BY day`, [doctorId]
  );
  const [todayCount] = await pool.execute(
    `SELECT COUNT(*) AS c FROM appointments
     WHERE doctor_id = ? AND status='booked' AND DATE(appt_datetime) = CURDATE()`, [doctorId]
  );
  return {
    revenue_collected: Number(revenueRows[0].revenue || 0),
    upcoming_appointments: Number(revenueRows[0].upcoming || 0),
    appointments_per_day_next_7_days: perDay,
    utilization_per_day_next_7_days: utilPerDay,
    utilization_today_pct: Number(((todayCount[0].c / 12) * 100).toFixed(2)),
  };
}

module.exports = { create, findById, findAll, update, remove, reportAllDoctors, busyDays, statistics };