const pool = require('../config/db');
const Appointment = require('../models/appointmentModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const {
  parseAppointmentDate, validateBookingSlot, MAX_PER_DAY,
} = require('../services/validationService');
const audit = require('../services/auditLogger');
const queue = require('../services/queueService');
const { acquireDoctorDayLock } = require('../services/bookingLock');
const {
  ValidationError, NotFoundError, ConflictError,
} = require('../utils/errors');

function toSqlDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// POST /api/appointments
async function book(req, res, next) {
  try {
    const { patient_id, doctor_id, appt_datetime } = req.body || {};
    if (!patient_id || !doctor_id || !appt_datetime) {
      throw new ValidationError('patient_id, doctor_id, and appt_datetime are required');
    }
    const dt = parseAppointmentDate(appt_datetime);
    const check = validateBookingSlot(dt);
    if (!check.ok) throw new ValidationError(check.reason);

    const patient = await Patient.findById(patient_id);
    if (!patient) throw new NotFoundError('Patient not found');
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) throw new NotFoundError('Doctor not found');

    const apptDateTime = toSqlDateTime(dt);
    const dateStr = apptDateTime.slice(0, 10);
    const conn = await pool.getConnection();
    let id;
    let conflictMessage;
    let transactionStarted = false;
    try {
      await conn.beginTransaction();
      transactionStarted = true;
      let releaseDayLock;
      try {
        releaseDayLock = await acquireDoctorDayLock(conn, doctor_id, dateStr);
        const onDay = await Appointment.countDoctorBookingsOnDay(doctor_id, dateStr, conn);
        if (onDay >= MAX_PER_DAY) {
          conflictMessage = 'Doctor fully booked for this day';
          await conn.rollback();
          transactionStarted = false;
        } else {
          const existing = await Appointment.findBySlot(doctor_id, dt, conn);
          if (existing) {
            conflictMessage = 'Slot already booked';
            await conn.rollback();
            transactionStarted = false;
          } else {
            id = await Appointment.create(
              { patient_id, doctor_id, appt_datetime: dt, amount_paid: doctor.consultation_fee },
              conn
            );
            await conn.commit();
            transactionStarted = false;
          }
        }
      } catch (error) {
        if (transactionStarted) {
          await conn.rollback();
          transactionStarted = false;
        }
        throw error;
      } finally {
        if (releaseDayLock) await releaseDayLock();
      }

      if (conflictMessage) {
        try {
          await queue.pushWaitlist({
            patient_id,
            doctor_id,
            appt_datetime: apptDateTime,
          });
        } catch (error) {
          console.error('Waitlist queue error:', error.message);
        }

        throw new ConflictError(conflictMessage);
      }

      const row = await Appointment.findById(id);

      await audit.log({
        event: 'booking',
        appointment_id: id,
        patient_id,
        doctor_id,
        appt_datetime: apptDateTime,
      });

      try {
        await queue.pushNotification({
          type: 'booking_confirmation',
          appointment_id: id,
          patient_email: patient.email,
        });
      } catch (error) {
        console.error('Notification queue error:', error.message);
      }

      res.status(201).json(row);
    } catch (e) {
      // map unique-constraint race to 409
      if (e.code === 'ER_DUP_ENTRY') return next(new ConflictError('Slot already booked'));
      return next(e);
    } finally {
      conn.release();
    }
  } catch (e) { next(e); }
}

async function getByPatient(req, res, next) {
  try {
    const rows = await Appointment.findByPatient(req.params.patientId);
    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = { book, getByPatient };