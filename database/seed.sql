USE medibook;

INSERT INTO
    patients (full_name, email, phone)
VALUES (
        'Ama Mensah',
        'ama@mail.com',
        '0244-111-222'
    ),
    (
        'Kojo Owusu',
        'kojo@mail.com',
        '0555-333-444'
    ),
    (
        'Akua Asante',
        'akua@mail.com',
        '0200-555-666'
    );

INSERT INTO
    doctors (
        full_name,
        specialty,
        consultation_fee,
        room
    )
VALUES (
        'Dr. Boateng',
        'Dermatology',
        150.00,
        'R-12'
    ),
    (
        'Dr. Adjei',
        'Paediatrics',
        100.00,
        'R-03'
    ),
    (
        'Dr. Danquah',
        'Cardiology',
        200.00,
        'R-07'
    );
-- doctor with ZERO appointments

-- 8 appointments; doctor 1 has a near-cap day (11 bookings) on 2026-08-10
INSERT INTO
    appointments (
        patient_id,
        doctor_id,
        appt_datetime,
        status,
        amount_paid,
        booked_at
    )
VALUES (
        1,
        1,
        '2026-08-10 09:00:00',
        'booked',
        150.00,
        '2026-07-01 10:00:00'
    ),
    (
        2,
        1,
        '2026-08-10 09:30:00',
        'booked',
        150.00,
        '2026-07-02 10:00:00'
    ),
    (
        3,
        1,
        '2026-08-10 10:00:00',
        'booked',
        150.00,
        '2026-07-03 10:00:00'
    ),
    (
        1,
        1,
        '2026-08-10 10:30:00',
        'booked',
        150.00,
        '2026-07-04 10:00:00'
    ),
    (
        2,
        1,
        '2026-08-10 11:00:00',
        'booked',
        150.00,
        '2026-07-05 10:00:00'
    ),
    (
        3,
        1,
        '2026-08-10 11:30:00',
        'booked',
        150.00,
        '2026-07-06 10:00:00'
    ),
    (
        1,
        1,
        '2026-08-10 12:00:00',
        'booked',
        150.00,
        '2026-07-07 10:00:00'
    ),
    (
        2,
        1,
        '2026-08-10 12:30:00',
        'booked',
        150.00,
        '2026-07-08 10:00:00'
    ),
    -- Doctor 2 appointments
    (
        1,
        2,
        '2026-08-15 10:00:00',
        'booked',
        100.00,
        '2026-07-03 10:00:00'
    ),
    (
        2,
        2,
        '2026-08-15 10:30:00',
        'booked',
        100.00,
        '2026-07-04 10:00:00'
    ),
    (
        3,
        2,
        '2026-08-15 11:00:00',
        'booked',
        100.00,
        '2026-07-05 10:00:00'
    ),
    -- One cancelled appointment (doctor 1, less than 24h notice -> 0 refund)
    (
        3,
        1,
        '2026-08-11 13:00:00',
        'cancelled',
        150.00,
        '2026-07-06 10:00:00'
    );

UPDATE appointments
SET
    status = 'cancelled',
    refund_amount = 0,
    cancelled_at = '2026-08-11 12:00:00'
WHERE
    appointment_id = 12;