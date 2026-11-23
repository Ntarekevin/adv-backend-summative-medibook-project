const {
  parseAppointmentDate, validateBookingSlot, isWithinWorkingHours, isOnSlotBoundary, isInFuture,
} = require('../src/services/validationService');

describe('validationService', () => {
  const now = new Date('2026-08-01T12:00:00');

  test('parses SQL and ISO appointment datetimes', () => {
    expect(parseAppointmentDate('2026-08-02 10:00:00')).toBeInstanceOf(Date);
    expect(parseAppointmentDate('2026-08-02T10:00:00Z').toISOString())
      .toBe('2026-08-02T10:00:00.000Z');
  });

  test('rejects malformed appointment datetimes', () => {
    expect(parseAppointmentDate('not-a-date')).toBeNull();
    expect(parseAppointmentDate(123)).toBeNull();
  });

  test('accepts a valid 30-min slot within working hours', () => {
    const d = new Date('2026-08-02T10:00:00');
    expect(validateBookingSlot(d, now).ok).toBe(true);
  });

  test('rejects exact 17:00 (working hours end is exclusive)', () => {
    const d = new Date('2026-08-02T17:00:00');
    expect(validateBookingSlot(d, now).ok).toBe(false);
  });

  test('accepts exact 09:00 start', () => {
    const d = new Date('2026-08-02T09:00:00');
    expect(validateBookingSlot(d, now).ok).toBe(true);
  });

  test('rejects 09:15 (off 30-min boundary)', () => {
    const d = new Date('2026-08-02T09:15:00');
    expect(validateBookingSlot(d, now).ok).toBe(false);
  });

  test('rejects past datetime', () => {
    const d = new Date('2026-07-31T10:00:00');
    expect(validateBookingSlot(d, now).ok).toBe(false);
  });

  test('rejects malformed date', () => {
    expect(validateBookingSlot('not-a-date', now).ok).toBe(false);
  });

  test('isWithinWorkingHours rejects null', () => {
    expect(isWithinWorkingHours(null)).toBe(false);
  });
});