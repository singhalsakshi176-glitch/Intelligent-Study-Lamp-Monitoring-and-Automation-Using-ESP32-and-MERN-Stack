const Session = require('../models/Session');

const DEFAULT_DEVICE = process.env.DEFAULT_DEVICE_ID || 'esp32-lamp-01';

/**
 * POST /api/lamp/on
 * Starts a new session. If an open session already exists, returns it instead of creating duplicate.
 * Server clock is strictly used.
 */
async function turnLampOn(req, res) {
  try {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId || DEFAULT_DEVICE;
    const now = new Date();

    // Check if an open session already exists (endTime === null)
    let activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (activeSession) {
      return res.status(200).json({
        success: true,
        message: 'Lamp is already ON. Returning existing active session.',
        alreadyActive: true,
        session: activeSession,
      });
    }

    // Create new session with server-generated startTime
    const newSession = await Session.create({
      deviceId,
      startTime: now,
      endTime: null,
      durationMinutes: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Lamp turned ON. New study session started.',
      alreadyActive: false,
      session: newSession,
    });
  } catch (error) {
    console.error('Error in turnLampOn:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: error.message,
    });
  }
}

/**
 * POST /api/lamp/off
 * Closes the latest open session and calculates durationMinutes on the server.
 */
async function turnLampOff(req, res) {
  try {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId || DEFAULT_DEVICE;
    const now = new Date();

    // Find the latest open session
    const activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (!activeSession) {
      return res.status(200).json({
        success: false,
        message: 'No open study session found for this device.',
        session: null,
      });
    }

    const startTime = activeSession.startTime;
    const elapsedMs = Math.max(0, now.getTime() - startTime.getTime());
    // Keep 1 decimal precision for short test sessions or round to nearest minute
    const durationMinutes = Math.round((elapsedMs / 60000) * 10) / 10;

    activeSession.endTime = now;
    activeSession.durationMinutes = durationMinutes;
    await activeSession.save();

    return res.status(200).json({
      success: true,
      message: 'Lamp turned OFF. Session closed.',
      session: activeSession,
    });
  } catch (error) {
    console.error('Error in turnLampOff:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to close session',
      error: error.message,
    });
  }
}

/**
 * GET /api/lamp/status/:deviceId
 * Returns: { isOn, since }
 */
async function getLampStatus(req, res) {
  try {
    const deviceId = req.params.deviceId || DEFAULT_DEVICE;

    const activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (activeSession) {
      const elapsedMinutes = Math.round(((Date.now() - activeSession.startTime.getTime()) / 60000) * 10) / 10;
      return res.status(200).json({
        isOn: true,
        since: activeSession.startTime,
        deviceId,
        activeSessionId: activeSession._id,
        elapsedMinutes,
      });
    }

    // If lamp is off, optionally fetch the most recent session end time for reference
    const lastSession = await Session.findOne({
      deviceId,
      endTime: { $ne: null },
    }).sort({ endTime: -1 });

    return res.status(200).json({
      isOn: false,
      since: null,
      deviceId,
      lastEndedAt: lastSession ? lastSession.endTime : null,
    });
  } catch (error) {
    console.error('Error in getLampStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get lamp status',
      error: error.message,
    });
  }
}

module.exports = {
  turnLampOn,
  turnLampOff,
  getLampStatus,
};