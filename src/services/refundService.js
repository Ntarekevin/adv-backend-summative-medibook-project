// Refund policy (documented):
//   notice > 48h            -> 100%
//   24h <= notice <= 48h    -> 50%
//   notice < 24h            -> 0%
// Boundaries: exactly 48h = 50% (falls into middle tier),
//             exactly 24h = 50% (falls into middle tier, "less than 24h" only for < 24h).
const HOUR = 60 * 60 * 1000;

function calculateRefund(amountPaid, apptDatetime, now = new Date()) {
  const appt = new Date(apptDatetime);
  const noticeMs = appt.getTime() - now.getTime();

  if (noticeMs > 48 * HOUR) return Number((amountPaid * 1.0).toFixed(2));
  if (noticeMs >= 24 * HOUR) return Number((amountPaid * 0.5).toFixed(2));
  return 0;
}

module.exports = { calculateRefund };