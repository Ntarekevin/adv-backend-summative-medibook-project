const express = require('express');
const appointments = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', appointments.book);
router.get('/patient/:patientId', appointments.getByPatient);

module.exports = router;