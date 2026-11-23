const Patient = require('../models/patientModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

function validatePatient(body) {
  const { full_name, email, phone } = body || {};
  if (!full_name || !email || !phone) throw new ValidationError('full_name, email, and phone are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Invalid email format');
  return { full_name, email, phone };
}

async function create(req, res, next) {
  try { res.status(201).json(await Patient.create(validatePatient(req.body))); }
  catch (e) { next(e); }
}
async function getAll(req, res, next) {
  try { res.json(await Patient.findAll()); } catch (e) { next(e); }
}
async function getOne(req, res, next) {
  try {
    const p = await Patient.findById(req.params.id);
    if (!p) throw new NotFoundError('Patient not found');
    res.json(p);
  } catch (e) { next(e); }
}
async function update(req, res, next) {
  try {
    const p = await Patient.update(req.params.id, validatePatient(req.body));
    if (!p) throw new NotFoundError('Patient not found');
    res.json(p);
  } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try {
    const ok = await Patient.remove(req.params.id);
    if (!ok) throw new NotFoundError('Patient not found');
    res.status(204).end();
  } catch (e) { next(e); }
}

module.exports = { create, getAll, getOne, update, remove };