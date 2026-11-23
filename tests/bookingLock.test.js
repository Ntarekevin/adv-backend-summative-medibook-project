const { acquireDoctorDayLock } = require('../src/services/bookingLock');
const { ConflictError } = require('../src/utils/errors');

describe('acquireDoctorDayLock', () => {
  test('acquires and releases the named doctor/day lock', async () => {
    const conn = {
      execute: jest.fn()
        .mockResolvedValueOnce([[{ got: 1 }]])
        .mockResolvedValueOnce([[{ released: 1 }]]),
    };

    const release = await acquireDoctorDayLock(conn, 7, '2026-08-02');
    await release();

    expect(conn.execute).toHaveBeenNthCalledWith(
      1,
      'SELECT GET_LOCK(?, 5) AS got',
      ['medibook:doc:7:2026-08-02']
    );
    expect(conn.execute).toHaveBeenNthCalledWith(
      2,
      'SELECT RELEASE_LOCK(?) AS released',
      ['medibook:doc:7:2026-08-02']
    );
  });

  test('reports a lock acquisition timeout as a conflict', async () => {
    const conn = { execute: jest.fn().mockResolvedValue([[{ got: 0 }]]) };

    await expect(acquireDoctorDayLock(conn, 7, '2026-08-02'))
      .rejects.toBeInstanceOf(ConflictError);
    expect(conn.execute).toHaveBeenCalledTimes(1);
  });
});
