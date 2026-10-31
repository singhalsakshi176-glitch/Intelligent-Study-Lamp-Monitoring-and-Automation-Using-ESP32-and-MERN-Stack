import React from 'react';
import { 
  Lamp, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles, 
  Timer, 
  Flame,
  CheckCircle2,
  CircleDot
} from 'lucide-react';

function formatStartedAt(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(date);
  } catch (e) {
    return '';
  }
}

export default function StatCards({
  lampStatus,
  todayStats,
  compareStats,
  timerDisplay,
  goalMinutes = 180,
}) {
  const isLampOn = Boolean(lampStatus?.isOn);
  const startTimeFormatted = formatStartedAt(lampStatus?.since);

  // Today totals
  const todayMinutes = todayStats?.totalMinutes || 0;
  const todayFormatted = todayStats?.formattedTime || '0m';
  const goalPercent = Math.min(100, Math.round((todayMinutes / (goalMinutes || 1)) * 100));

  // Yesterday totals
  const yesterdayMinutes = compareStats?.yesterdayMinutes || 0;
  const yesterdayFormatted = compareStats?.formattedYesterday || '0m';

  // Comparison metrics
  const differenceMinutes = compareStats?.differenceMinutes || 0;
  const percentChange = compareStats?.percentChange || 0;
  const isIncrease = differenceMinutes > 0;
  const isDecrease = differenceMinutes < 0;
  const isSame = differenceMinutes === 0;

  // Short motivational message based on progress
  let motivationalMessage = 'Start a session to build today\'s study streak!';
  if (isIncrease) {
    motivationalMessage = '🔥 Crushing it! You’ve surpassed yesterday’s study mark.';
  } else if (isDecrease) {
    const diffMins = Math.abs(differenceMinutes);
    motivationalMessage = `💪 ${diffMins}m more needed to match yesterday. You got this!`;
  } else if (todayMinutes > 0 && isSame) {
    motivationalMessage = '🎯 Solid consistency! You are pacing evenly with yesterday.';
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      
      {/* CARD 1: Current Status */}
      <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
        isLampOn
          ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : 'glass-card border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Status
          </span>
          <div className={`p-2 rounded-xl ${
            isLampOn
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            <Lamp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isLampOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {isLampOn ? 'ON' : 'OFF'}
            </span>
            {isLampOn && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 animate-pulse">
                <CircleDot className="w-3 h-3 text-emerald-500" />
                Live Session
              </span>
            )}
          </div>

          {/* Running Timer or Inactive state */}
          {isLampOn ? (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 dark:border-emerald-500/20">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Timer className="w-3.5 h-3.5 text-emerald-500" />
                  Started at {startTimeFormatted}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                {timerDisplay}
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study lamp idle. Turn on to start counting your next study block.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: Today's Study Time */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 glass-card border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all duration-300 shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Study Time
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {todayFormatted}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Goal: {(goalMinutes / 60).toFixed(1)}h</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{goalPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, goalPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Yesterday's Study Time */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 glass-card border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Yesterday's Study Time
          </span>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {yesterdayFormatted}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Daily target reference</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">({yesterdayMinutes} min)</span>
            </p>
          </div>
        </div>
      </div>

      {/* CARD 4: Comparison */}
      <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
        isIncrease
          ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/30'
          : isDecrease
          ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 dark:border-rose-500/30'
          : 'glass-card border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Vs Yesterday
          </span>
          <div className={`p-2 rounded-xl ${
            isIncrease
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : isDecrease
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {isIncrease ? (
              <TrendingUp className="w-5 h-5" />
            ) : isDecrease ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Minus className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xl sm:text-2xl font-bold flex items-center gap-1 ${
              isIncrease
                ? 'text-emerald-600 dark:text-emerald-400'
                : isDecrease
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {isIncrease && '▲'}
              {isDecrease && '▼'}
              {isSame && '—'}
              <span>{Math.abs(Math.round(differenceMinutes))} min</span>
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isIncrease
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : isDecrease
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-snug">
              {motivationalMessage}
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
