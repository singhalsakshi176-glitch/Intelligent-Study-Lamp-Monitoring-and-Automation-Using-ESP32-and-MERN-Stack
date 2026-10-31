import React from 'react';
import { 
  History, 
  Clock, 
  Calendar, 
  CircleDot, 
  CheckCircle2, 
  Timer,
  ChevronRight,
  BookOpen
} from 'lucide-react';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const sessionDate = new Date(isoString);
    const today = new Date();
    
    // Check if same day
    const isToday = sessionDate.toDateString() === today.toDateString();
    
    // Check if yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = sessionDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(sessionDate);
  } catch (e) {
    return '—';
  }
}

function formatClockTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(new Date(isoString));
  } catch (e) {
    return '—';
  }
}

export default function SessionHistoryTable({ sessions = [], timerDisplay }) {
  const hasSessions = sessions && sessions.length > 0;

  return (
    <section className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
      {/* Table Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recent Study Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session logs recorded in real time from your ESP32 study lamp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
            Showing latest {sessions.length} sessions
          </span>
        </div>
      </div>

      {/* Table Body or Empty State */}
      {!hasSessions ? (
        <div className="py-16 px-4 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mb-3">
            <BookOpen className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No study sessions yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Turn ON your study lamp to begin tracking your first productive study session!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 sm:px-6">Status & Date</th>
                <th scope="col" className="py-3 px-4 sm:px-6">Start Time</th>
                <th scope="col" className="py-3 px-4 sm:px-6">End Time</th>
                <th scope="col" className="py-3 px-4 sm:px-6 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {sessions.map((session, index) => {
                const isActive = session.isActive || session.endTime === null;
                const formattedDate = formatDate(session.startTime);
                const startTime = formatClockTime(session.startTime);
                const endTime = isActive ? 'In Progress' : formatClockTime(session.endTime);

                return (
                  <tr
                    key={session._id || `session-${index}`}
                    className={`transition-colors duration-150 ${
                      isActive
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Status & Date */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formattedDate}
                        </span>
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono text-xs">
                      {startTime}
                    </td>

                    {/* End Time */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono text-xs">
                      {isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CircleDot className="w-3 h-3 animate-spin text-emerald-500" />
                          Currently ON
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">
                          {endTime}
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-flex items-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                          <Timer className="w-3.5 h-3.5 mr-1 animate-pulse" />
                          {timerDisplay || `${session.durationMinutes}m`}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          {session.formattedDuration || `${session.durationMinutes}m`}
                        </span>
                      )}
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
