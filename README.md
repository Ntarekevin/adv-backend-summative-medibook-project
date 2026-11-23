# MediBook — Clinic Appointment System

## Setup

1. **MySQL**: `mysql -u root -p < database/schema.sql && mysql -u root -p < database/seed.sql`
   - MySQL 8.0+ is recommended; MySQL 5.7+ supports the stored generated column used for active slots.
2. **Redis**: ensure running on `localhost:6379`
3. **Env**: `cp .env.example .env` and fill values
4. `npm install`
5. `npm start` (API) — separate terminal `npm run worker` (background worker)
6. `npm test` (unit tests — no DB/Redis needed)

## API

| Method              | Path                                   | Purpose                                  |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| POST/GET/PUT/DELETE | `/api/patients[/:id]`                  | Patient CRUD                             |
| POST/GET/PUT/DELETE | `/api/doctors[/:id]`                   | Doctor CRUD                              |
| GET                 | `/api/doctors/:id/statistics`          | Doctor stats                             |
| GET                 | `/api/doctors/reports/all`             | All-doctor revenue + count (incl. zeros) |
| GET                 | `/api/doctors/reports/busy-days`       | >80% capacity days                       |
| POST                | `/api/appointments`                    | Book                                     |
| DELETE              | `/api/appointments/:id`                | Cancel + refund                          |
| GET                 | `/api/appointments/patient/:patientId` | Patient's bookings                       |
| GET/POST            | `/feedback[?lang=fr]`                   | i18n feedback page and submission        |

## Design Justifications

### Justification — Part C (Booking & Cancellation)

Bookings acquire a MySQL named lock for the doctor and date before checking daily capacity and slot availability. The lock is held through commit or rollback, while `UNIQUE(doctor_id, active_slot)` provides a database-level last line of defense. `active_slot` is generated from `appt_datetime` only when `status = 'booked'`, so cancelled appointments do not prevent rebooking.

Refunds are computed server-side in `refundService.calculateRefund`: more than 48 hours gives 100%, 24–48 hours gives 50%, and less than 24 hours gives 0%. Cancellation and the refund amount are committed in the same transaction.

### Justification — Part D (Audit Log)

Audit entries use `fs.promises.appendFile` and the log directory is created automatically. Logging failures are reported without failing the user's request.

### Justification — Part E (Queues & Redis)

When a slot or the daily cap is full, the request is added to a Redis waitlist. On cancellation, the worker looks for a matching doctor and slot and attempts promotion. A failed promotion is re-queued so the patient is not lost.

## Video Walkthrough

[Add your YouTube / Drive link here]
