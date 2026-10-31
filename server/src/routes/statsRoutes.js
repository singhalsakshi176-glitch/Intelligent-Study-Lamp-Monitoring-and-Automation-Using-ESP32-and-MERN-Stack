const express = require('express');
const router = express.Router();
const {
  getTodayStats,
  getCompareStats,
  getLast7DaysStats,
} = require('../controllers/statsController');

// GET /api/stats/today?deviceId=
router.get('/today', getTodayStats);

// GET /api/stats/compare?deviceId=
router.get('/compare', getCompareStats);

// GET /api/stats/last7days?deviceId=
router.get('/last7days', getLast7DaysStats);

module.exports = router;
