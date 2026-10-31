const Session = require('../models/Session');
const { getTodayAndYesterdayBoundaries, TIMEZONE } = require('./timezone');

const DEFAULT_DEVICE = process.env.DEFAULT_DEVICE_ID || 'esp32-lamp-01';

function createKolkataDateTime(dayStartUtc, hour, minute) {
  return new Date(dayStartUtc.getTime() + (hour * 60 + minute) * 60 * 1000);
}

async function populateSeedData(deviceId = DEFAULT_DEVICE, forceClear = false) {
  if (!forceClear) {
    const existingCount = await Session.countDocuments({ deviceId });
    if (existingCount > 0) {
      console.log(`ℹ️ Database already contains ${existingCount} sessions for ${deviceId}. Skipping auto-seed.`);
      return existingCount;
    }
  } else {
    await Session.deleteMany({ deviceId });
  }

  const { today } = getTodayAndYesterdayBoundaries();
  const sessionsToInsert = [];

  const dailyProfiles = [
    // 9 days ago
    [
      { startH: 9, startM: 15, durationM: 75 },
      { startH: 14, startM: 30, durationM: 60 },
      { startH: 19, startM: 0, durationM: 90 },
    ],
    // 8 days ago
    [
      { startH: 10, startM: 0, durationM: 110 },
      { startH: 16, startM: 15, durationM: 85 },
      { startH: 21, startM: 0, durationM: 65 },
    ],
    // 7 days ago
    [
      { startH: 8, startM: 30, durationM: 90 },
      { startH: 15, startM: 0, durationM: 120 },
    ],
    // 6 days ago
    [
      { startH: 9, startM: 45, durationM: 80 },
      { startH: 14, startM: 0, durationM: 105 },
      { startH: 19, startM: 30, durationM: 75 },
    ],
    // 5 days ago
    [
      { startH: 10, startM: 30, durationM: 95 },
      { startH: 17, startM: 0, durationM: 80 },
      { startH: 20, startM: 45, durationM: 90 },
    ],
    // 4 days ago
    [
      { startH: 9, startM: 0, durationM: 120 },
      { startH: 15, startM: 30, durationM: 90 },
      { startH: 20, startM: 0, durationM: 60 },
    ],
    // 3 days ago
    [
      { startH: 11, startM: 0, durationM: 70 },
      { startH: 16, startM: 0, durationM: 110 },
      { startH: 21, startM: 15, durationM: 55 },
    ],
    // 2 days ago
    [
      { startH: 8, startM: 45, durationM: 105 },
      { startH: 14, startM: 15, durationM: 125 },
      { startH: 19, startM: 0, durationM: 80 },
    ],
    // Yesterday (~170m = 2h 50m)
    [
      { startH: 9, startM: 30, durationM: 90 },
      { startH: 15, startM: 0, durationM: 80 },
    ],
    // Today (~140m = 2h 20m completed)
    [
      { startH: 9, startM: 0, durationM: 75 },
      { startH: 14, startM: 0, durationM: 65 },
    ],
  ];

  for (let i = 0; i < dailyProfiles.length; i++) {
    const daysAgo = dailyProfiles.length - 1 - i;
    const dayStartUtc = new Date(today.start.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const profile = dailyProfiles[i];
    for (const slot of profile) {
      const startTime = createKolkataDateTime(dayStartUtc, slot.startH, slot.startM);
      const endTime = new Date(startTime.getTime() + slot.durationM * 60 * 1000);

      sessionsToInsert.push({
        deviceId,
        startTime,
        endTime,
        durationMinutes: slot.durationM,
      });
    }
  }

  const inserted = await Session.insertMany(sessionsToInsert);
  console.log(`✅ Seeded ${inserted.length} realistic study sessions for ${deviceId}`);
  return inserted.length;
}

module.exports = { populateSeedData };
