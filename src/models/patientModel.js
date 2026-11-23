const pool = require('../config/db');

async function create({ full_name, email, phone }) {
  const [r] = await pool.execute(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [full_name, email, phone]
  );
  return findById(r.insertId);
}
async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM patients WHERE patient_id = ?', [id]);
  return rows[0] || null;
}
async function findAll() {
  const [rows] = await pool.execute('SELECT * FROM patients ORDER BY patient_id');
  return rows;
}
async function update(id, { full_name, email, phone }) {
  const [r] = await pool.execute(
    'UPDATE patients SET full_name=?, email=?, phone=? WHERE patient_id=?',
    [full_name, email, phone, id]
  );
  return r.affectedRows ? findById(id) : null;
}
async function remove(id) {
  const [r] = await pool.execute('DELETE FROM patients WHERE patient_id=?', [id]);
  return r.affectedRows > 0;
}

module.exports = { create, findById, findAll, update, remove };