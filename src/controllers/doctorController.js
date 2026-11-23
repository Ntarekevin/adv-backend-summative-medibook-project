const Doctor = require('../models/doctorModel');
const { ValidationError, NotFoundError } = require('../utils/errors');

function validateDoctor(body) {
  const { full_name, specialty, consultation_fee, room } = body || {};
  if (!full_name || !specialty || consultation_fee == null || !room) {
    throw new ValidationError('full_name, specialty, consultation_fee, and room are required');
  }
  const fee = Number(consultation_fee);
  if (Number.isNaN(fee) || fee < 0) throw new ValidationError('consultation_fee must be a non-negative number');
  return { full_name, specialty, consultation_fee: fee, room };
}

async function create(req, res, next) {
  try { res.status(201).json(await Doctor.create(validateDoctor(req.body))); }
  catch (e) { next(e); }
}
async function getAll(req, res, next) {
  try { res.json(await Doctor.findAll()); } catch (e) { next(e); }
}
async function getOne(req, res, next) {
  try {
    const d = await Doctor.findById(req.params.id);
    if (!d) throw new NotFoundError('Doctor not found');
    res.json(d);
  } catch (e) { next(e); }
}
async function update(req, res, next) {
  try {
    const d = await Doctor.update(req.params.id, validateDoctor(req.body));
    if (!d) throw new NotFoundError('Doctor not found');
    res.json(d);
  } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try {
    const ok = await Doctor.remove(req.params.id);
    if (!ok) throw new NotFoundError('Doctor not found');
    res.status(204).end();
  } catch (e) { next(e); }
}
async function statistics(req, res, next) {
  try {
    const d = await Doctor.findById(req.params.id);
    if (!d) throw new NotFoundError('Doctor not found');
    res.json(await Doctor.statistics(req.params.id));
  } catch (e) { next(e); }
}
async function report(req, res, next) {
  try { res.json(await Doctor.reportAllDoctors()); } catch (e) { next(e); }
}
async function busyDays(req, res, next) {
  try { res.json(await Doctor.busyDays()); } catch (e) { next(e); }
}

module.exports = { create, getAll, getOne, update, remove, statistics, report, busyDays };