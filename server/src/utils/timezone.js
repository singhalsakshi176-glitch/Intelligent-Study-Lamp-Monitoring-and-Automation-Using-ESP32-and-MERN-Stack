/**
 * Timezone utilities for Asia/Kolkata (UTC+05:30)
 */

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';
const KOLKATA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 in ms

/**
 * Get date string in YYYY-MM-DD format for Asia/Kolkata timezone
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
function getKolkataDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Get UTC Date objects representing the start and end of a specific day in Asia/Kolkata
 * @param {string|Date} dateInput YYYY-MM-DD string or Date object
 * @returns {{ start: Date, end: Date, dateStr: string }}
 */
function getKolkataDayBoundaries(dateInput = new Date()) {
  const dateStr = typeof dateInput === 'string'
    ? dateInput
    : getKolkataDateString(dateInput);

  const [y, m, d] = dateStr.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const start = new Date(utcMidnight - KOLKATA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { start, end, dateStr };
}

/**
 * Get boundaries for Today and Yesterday in Asia/Kolkata
 */
function getTodayAndYesterdayBoundaries() {
  const now = new Date();
  const todayStr = getKolkataDateString(now);

  const today = getKolkataDayBoundaries(todayStr);

  // Yesterday is 24 hours before today start
  const yesterdayStart = new Date(today.start.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayEnd = new Date(today.start.getTime() - 1);
  const yesterdayStr = getKolkataDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  return {
    today: { ...today, dateStr: todayStr },
    yesterday: { start: yesterdayStart, end: yesterdayEnd, dateStr: yesterdayStr },
  };
}

/**
 * Get boundaries and date list for the last N days (including today) in Asia/Kolkata
 * @param {number} days Default 7
 */
function getLastNDaysBoundaries(days = 7) {
  const { today } = getTodayAndYesterdayBoundaries();
  const daysList = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today.start.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const dateStr = getKolkataDateString(new Date(dayStart.getTime() + KOLKATA_OFFSET_MS));

    const dayName = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short',
    }).format(new Date(dayStart.getTime() + KOLKATA_OFFSET_MS));

    daysList.push({
      dateStr,
      label: dayName,
      start: dayStart,
      end: dayEnd,
      isToday: i === 0,
    });
  }

  const rangeStart = daysList[0].start;
  const rangeEnd = daysList[daysList.length - 1].end;

  return {
    daysList,
    rangeStart,
    rangeEnd,
  };
}

/**
 * Format total minutes into "2h 30m" format
 * @param {number} minutes
 * @returns {string}
 */
function formatMinutesToHoursMinutes(minutes) {
  const rounded = Math.round(minutes || 0);
  if (rounded <= 0) return '0m';
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

module.exports = {
  TIMEZONE,
  getKolkataDateString,
  getKolkataDayBoundaries,
  getTodayAndYesterdayBoundaries,
  getLastNDaysBoundaries,
  formatMinutesToHoursMinutes,
};
