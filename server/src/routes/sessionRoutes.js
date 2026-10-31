const express = require('express');
const router = express.Router();
const { getRecentSessions } = require('../controllers/statsController');

// GET /api/sessions?deviceId=&limit=10
router.get('/', getRecentSessions);

module.exports = router;
