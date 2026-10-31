import React from 'react';
import { Clock, BookOpen, AlertCircle } from 'lucide-react';

/**
 * Format date in Asia/Kolkata timezone
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const sessionDate = new Date(isoString);
    if (isNaN(sessionDate.getTime())) return '—';
    const now = new Date();

    const options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const dateStr = new Intl.DateTimeFormat('en-CA', options).format(sessionDate);
    const todayStr = new Intl.DateTimeFormat('en-CA', options).format(now);

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', options).format(yesterday);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(sessionDate);
  } catch {
    return '—';
  }
}

/**
 * Format clock time in Asia/Kolkata timezone
 */
function formatClockTime(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format duration in "2h 30m" format
 */
function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '0h 0m';
  const total = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

export default function SessionHistoryTable({
  sessions = [],
  loading = false,
  error = '',
  timerDisplay = '',
}) {
  // Sort sessions so running session (isActive or endTime === null) is on top
  const sortedSessions = React.useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];

    const activeList = [];
    const completedList = [];

    sessions.forEach((s) => {
      const isActive = s.isActive || s.endTime === null;
      if (isActive) {
        activeList.push(s);
      } else {
        completedList.push(s);
      }
    });

    // Sort completed sessions descending by startTime
    completedList.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return [...activeList, ...completedList];
  }, [sessions]);

  const hasSessions = sortedSessions.length > 0;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Session History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent study sessions recorded by ESP32 smart lamp
            </p>
          </div>
        </div>

        {hasSessions && (
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            Showing {sortedSessions.length} session{sortedSessions.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading && !hasSessions ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading session history...</p>
        </div>
      ) : error && !hasSessions ? (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 my-6 text-center"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : !hasSessions ? (
        <div className="py-12 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No study sessions recorded yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Turn ON your study lamp to begin tracking your first study session.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedSessions.map((session, index) => {
                const isActive = session.isActive || session.endTime === null;
                const formattedDate = formatDate(session.startTime);
                const startTime = formatClockTime(session.startTime);
                const endTime = isActive ? 'In Progress' : formatClockTime(session.endTime);
                const duration = isActive
                  ? timerDisplay || formatDuration(session.durationMinutes)
                  : formatDuration(session.durationMinutes);

                return (
                  <tr
                    key={session._id || `session-${index}`}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                        : index % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-800/30'
                    } hover:bg-indigo-50/40 dark:hover:bg-slate-800/70`}
                  >
                    {/* Date with Active badge if running */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}
                        <span
                          className={`font-semibold ${
                            isActive
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {formattedDate}
                        </span>
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {startTime}
                    </td>

                    {/* End Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Progress
                        </span>
                      ) : (
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {endTime}
                        </span>
                      )}
                    </td>

                    {/* Duration in standard format */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-block font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {duration}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
