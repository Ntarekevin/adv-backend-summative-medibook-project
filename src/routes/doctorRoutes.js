const express = require('express');
const c = require('../controllers/doctorController');
const router = express.Router();

router.get('/reports/all', c.report);
router.get('/reports/busy-days', c.busyDays);
router.post('/', c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.get('/:id/statistics', c.statistics);

module.exports = router;