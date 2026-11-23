const express = require('express');
const appointments = require('../controllers/appointmentController');
const cancellations = require('../controllers/cancellationController');

const router = express.Router();

router.post('/', appointments.book);
router.get('/patient/:patientId', appointments.getByPatient);
router.delete('/:id', cancellations.cancel);

module.exports = router;
