const express = require('express');
const c = require('../controllers/feedbackController');
const router = express.Router();

router.get('/', c.render);
router.post('/', (req, res) => {
  res.status(201).json({ received: true });
});

module.exports = router;