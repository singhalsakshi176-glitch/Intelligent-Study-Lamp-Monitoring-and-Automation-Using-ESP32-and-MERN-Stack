const Session = require('../models/Session');
const {
  getTodayAndYesterdayBoundaries,
  getLastNDaysBoundaries,
  formatMinutesToHoursMinutes,
  getKolkataDateString,
} = require('../utils/timezone');

const DEFAULT_DEVICE = process.env.DEFAULT_DEVICE_ID || 'esp32-lamp-01';

/**
 * Helper to calculate elapsed minutes for an active session
 */
function getActiveElapsedMinutes(activeSession, now = new Date()) {
  if (!activeSession) return 0;
  const elapsedMs = Math.max(0, now.getTime() - activeSession.startTime.getTime());
  return Math.round((elapsedMs / 60000) * 10) / 10;
}

/**
 * GET /api/stats/today?deviceId=
 * Total minutes studied today (including currently running session's elapsed time).
 * Day boundary defined by Asia/Kolkata timezone.
 */
async function getTodayStats(req, res) {
  try {
    const deviceId = req.query.deviceId || DEFAULT_DEVICE;
    const now = new Date();
    const { today } = getTodayAndYesterdayBoundaries();

    // Sum completed sessions starting today using aggregation
    const completedAggregation = await Session.aggregate([
      {
        $match: {
          deviceId,
          startTime: { $gte: today.start, $lte: today.end },
          endTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$durationMinutes' },
          sessionCount: { $sum: 1 },
        },
      },
    ]);

    let todayMinutes = completedAggregation.length > 0 ? completedAggregation[0].totalMinutes : 0;
    const completedCount = completedAggregation.length > 0 ? completedAggregation[0].sessionCount : 0;

    // Check if an active session is currently running
    const activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    let activeElapsed = 0;
    if (activeSession) {
      activeElapsed = getActiveElapsedMinutes(activeSession, now);
      todayMinutes += activeElapsed;
    }

    todayMinutes = Math.round(todayMinutes * 10) / 10;

    return res.status(200).json({
      deviceId,
      date: today.dateStr,
      totalMinutes: todayMinutes,
      formattedTime: formatMinutesToHoursMinutes(todayMinutes),
      isLampOn: !!activeSession,
      activeElapsedMinutes: activeElapsed,
      activeSessionStartedAt: activeSession ? activeSession.startTime : null,
      sessionCount: completedCount + (activeSession ? 1 : 0),
    });
  } catch (error) {
    console.error('Error in getTodayStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve today stats',
      error: error.message,
    });
  }
}

/**
 * GET /api/stats/compare?deviceId=
 * Returns { todayMinutes, yesterdayMinutes, differenceMinutes, percentChange }
 */
async function getCompareStats(req, res) {
  try {
    const deviceId = req.query.deviceId || DEFAULT_DEVICE;
    const now = new Date();
    const { today, yesterday } = getTodayAndYesterdayBoundaries();

    // Query today completed sessions
    const todayAgg = await Session.aggregate([
      {
        $match: {
          deviceId,
          startTime: { $gte: today.start, $lte: today.end },
          endTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$durationMinutes' },
        },
      },
    ]);

    // Query yesterday completed sessions
    const yesterdayAgg = await Session.aggregate([
      {
        $match: {
          deviceId,
          startTime: { $gte: yesterday.start, $lte: yesterday.end },
          endTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$durationMinutes' },
        },
      },
    ]);

    let todayMinutes = todayAgg.length > 0 ? todayAgg[0].total : 0;
    let yesterdayMinutes = yesterdayAgg.length > 0 ? yesterdayAgg[0].total : 0;

    // Add currently active elapsed time to today
    const activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (activeSession) {
      todayMinutes += getActiveElapsedMinutes(activeSession, now);
    }

    todayMinutes = Math.round(todayMinutes * 10) / 10;
    yesterdayMinutes = Math.round(yesterdayMinutes * 10) / 10;

    const differenceMinutes = Math.round((todayMinutes - yesterdayMinutes) * 10) / 10;

    let percentChange = 0;
    if (yesterdayMinutes === 0) {
      percentChange = todayMinutes > 0 ? 100 : 0;
    } else {
      percentChange = Math.round(((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100);
    }

    return res.status(200).json({
      deviceId,
      todayMinutes,
      yesterdayMinutes,
      differenceMinutes,
      percentChange,
      formattedToday: formatMinutesToHoursMinutes(todayMinutes),
      formattedYesterday: formatMinutesToHoursMinutes(yesterdayMinutes),
    });
  } catch (error) {
    console.error('Error in getCompareStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve comparison stats',
      error: error.message,
    });
  }
}

/**
 * GET /api/stats/last7days?deviceId=
 * Returns array of { date, totalMinutes } for the last 7 days (missing days filled with 0)
 * Uses MongoDB aggregation with Asia/Kolkata timezone.
 */
async function getLast7DaysStats(req, res) {
  try {
    const deviceId = req.query.deviceId || DEFAULT_DEVICE;
    const now = new Date();
    const { daysList, rangeStart, rangeEnd } = getLastNDaysBoundaries(7);
    const todayStr = getKolkataDateString(now);

    // Aggregate completed sessions by Asia/Kolkata date
    const aggResults = await Session.aggregate([
      {
        $match: {
          deviceId,
          startTime: { $gte: rangeStart, $lte: rangeEnd },
          endTime: { $ne: null },
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startTime',
              timezone: 'Asia/Kolkata',
            },
          },
          durationMinutes: 1,
        },
      },
      {
        $group: {
          _id: '$date',
          totalMinutes: { $sum: '$durationMinutes' },
        },
      },
    ]);

    // Build map for fast lookup
    const dateToMinutesMap = {};
    aggResults.forEach((item) => {
      dateToMinutesMap[item._id] = Math.round(item.totalMinutes * 10) / 10;
    });

    // Check for running session today and add its elapsed minutes
    const activeSession = await Session.findOne({
      deviceId,
      endTime: null,
    }).sort({ startTime: -1 });

    const activeElapsed = activeSession ? getActiveElapsedMinutes(activeSession, now) : 0;

    // Construct exactly 7 days array filling missing days with 0
    const result = daysList.map((day) => {
      let minutes = dateToMinutesMap[day.dateStr] || 0;
      if (day.dateStr === todayStr && activeElapsed > 0) {
        minutes = Math.round((minutes + activeElapsed) * 10) / 10;
      }
      return {
        date: day.dateStr,
        label: day.label, // e.g. 'Mon', 'Tue'
        totalMinutes: minutes,
        formattedHours: (minutes / 60).toFixed(1),
        formattedDuration: formatMinutesToHoursMinutes(minutes),
        isToday: day.isToday,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getLast7DaysStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve 7 days stats',
      error: error.message,
    });
  }
}

/**
 * GET /api/sessions?deviceId=&limit=10
 * Returns recent sessions list (latest first).
 * The running session (if any) is placed at the top with isActive: true.
 */
async function getRecentSessions(req, res) {
  try {
    const deviceId = req.query.deviceId || DEFAULT_DEVICE;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const now = new Date();

    const sessions = await Session.find({ deviceId })
      .sort({ startTime: -1 })
      .limit(limit)
      .lean();

    const formattedSessions = sessions.map((s) => {
      const isActive = s.endTime === null;
      let durationMinutes = s.durationMinutes || 0;
      if (isActive) {
        durationMinutes = Math.round(((now.getTime() - new Date(s.startTime).getTime()) / 60000) * 10) / 10;
      }

      return {
        _id: s._id,
        deviceId: s.deviceId,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes,
        formattedDuration: formatMinutesToHoursMinutes(durationMinutes),
        isActive,
      };
    });

    return res.status(200).json(formattedSessions);
  } catch (error) {
    console.error('Error in getRecentSessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent sessions',
      error: error.message,
    });
  }
}

module.exports = {
  getTodayStats,
  getCompareStats,
  getLast7DaysStats,
  getRecentSessions,
};
