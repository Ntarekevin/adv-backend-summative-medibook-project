-- MediBook Database Schema
DROP DATABASE IF EXISTS medibook;

CREATE DATABASE medibook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE medibook;

CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    room VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fee CHECK (consultation_fee >= 0)
) ENGINE = InnoDB;

CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appt_datetime DATETIME NOT NULL,
    status ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
    active_slot DATETIME GENERATED ALWAYS AS
        (CASE WHEN status = 'booked' THEN appt_datetime ELSE NULL END) STORED,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME NULL,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id) ON DELETE RESTRICT,
    CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0),
    CONSTRAINT chk_refund CHECK (refund_amount >= 0),
    CONSTRAINT chk_refund_le_paid CHECK (refund_amount <= amount_paid),
    CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot),
    CONSTRAINT uq_patient_active_slot UNIQUE (patient_id, doctor_id, active_slot),
    INDEX idx_doctor_status_date (
        doctor_id,
        status,
        appt_datetime
    ),
    INDEX idx_patient_date (patient_id, appt_datetime)
) ENGINE = InnoDB;