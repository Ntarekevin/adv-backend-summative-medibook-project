const { calculateRefund } = require('../src/services/refundService');
const H = 60 * 60 * 1000;

describe('calculateRefund', () => {
  // fixed reference time
  const now = new Date('2026-08-01T12:00:00Z');

  test('more than 48h notice -> 100%', () => {
    const appt = new Date(now.getTime() + 72 * H); // 72h
    expect(calculateRefund(150, appt, now)).toBe(150);
  });

  test('exactly 48h boundary -> 50% (per policy: >48h is 100%)', () => {
    const appt = new Date(now.getTime() + 48 * H);
    expect(calculateRefund(150, appt, now)).toBe(75);
  });

  test('between 24h and 48h -> 50%', () => {
    const appt = new Date(now.getTime() + 30 * H);
    expect(calculateRefund(150, appt, now)).toBe(75);
  });

  test('exactly 24h boundary -> 50% (less than 24h is 0%)', () => {
    const appt = new Date(now.getTime() + 24 * H);
    expect(calculateRefund(150, appt, now)).toBe(75);
  });

  test('less than 24h -> 0%', () => {
    const appt = new Date(now.getTime() + 23 * H);
    expect(calculateRefund(150, appt, now)).toBe(0);
  });

  test('past appointment -> 0%', () => {
    const appt = new Date(now.getTime() - 5 * H);
    expect(calculateRefund(150, appt, now)).toBe(0);
  });
});