const { ConflictError } = require('../utils/errors');

async function acquireDoctorDayLock(conn, doctorId, date) {
  const lockName = `medibook:doc:${doctorId}:${date}`;
  const [[row]] = await conn.execute('SELECT GET_LOCK(?, 5) AS got', [lockName]);

  if (Number(row.got) !== 1) {
    throw new ConflictError('Booking in progress, retry');
  }

  return async function release() {
    const [[result]] = await conn.execute('SELECT RELEASE_LOCK(?) AS released', [lockName]);
    if (Number(result.released) !== 1) {
      throw new Error(`Failed to release booking lock ${lockName}`);
    }
  };
}

module.exports = { acquireDoctorDayLock };
