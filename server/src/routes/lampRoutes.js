const express = require('express');
const router = express.Router();
const {
  turnLampOn,
  turnLampOff,
  getLampStatus,
} = require('../controllers/lampController');

// POST /api/lamp/on -> starts a new session (or returns existing active one)
router.post('/on', turnLampOn);

// POST /api/lamp/off -> closes the active session and computes duration
router.post('/off', turnLampOff);

// GET /api/lamp/status/:deviceId -> returns { isOn, since }
router.get('/status/:deviceId', getLampStatus);

// GET /api/lamp/status -> fallback with default device
router.get('/status', getLampStatus);

module.exports = router;
