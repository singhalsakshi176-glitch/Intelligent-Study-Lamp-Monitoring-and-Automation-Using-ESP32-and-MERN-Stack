import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { 
  BarChart3, 
  Target, 
  Flame, 
  Check, 
  Edit3, 
  Sliders, 
  Sparkles,
  PieChart as PieIcon 
} from 'lucide-react';

// Custom Tooltip for 7-day Bar Chart
function Custom7DayTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = (data.totalMinutes / 60).toFixed(1);
    return (
      <div className="bg-slate-900 text-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs">
        <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between gap-2">
          <span>{data.label} ({data.date})</span>
          {data.isToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold uppercase">
              Today
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-indigo-300">
          {data.formattedDuration || `${data.totalMinutes}m`}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {hours} hours total
        </div>
      </div>
    );
  }
  return null;
}

export default function ChartsSection({
  last7Days = [],
  todayStats,
  compareStats,
  goalMinutes = 180,
  onUpdateGoal,
  darkMode,
}) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState(goalMinutes / 60);

  const todayMinutes = todayStats?.totalMinutes || 0;
  const yesterdayMinutes = compareStats?.yesterdayMinutes || 0;

  // Calculate goal progress
  const goalPercent = Math.min(100, Math.round((todayMinutes / (goalMinutes || 1)) * 100));
  const remainingMinutes = Math.max(0, goalMinutes - todayMinutes);

  // SVG circular progress calculation
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (Math.min(goalPercent, 100) / 100) * circumference;

  // Comparison data for Today vs Yesterday
  const comparisonData = [
    {
      name: 'Yesterday',
      minutes: yesterdayMinutes,
      hours: (yesterdayMinutes / 60).toFixed(1),
      formatted: compareStats?.formattedYesterday || '0m',
      fill: darkMode ? '#64748b' : '#94a3b8',
    },
    {
      name: 'Today',
      minutes: todayMinutes,
      hours: (todayMinutes / 60).toFixed(1),
      formatted: todayStats?.formattedTime || '0m',
      fill: todayMinutes >= yesterdayMinutes ? '#10b981' : '#6366f1',
    },
  ];

  const handleSaveGoal = () => {
    const mins = Math.max(30, Math.round(Number(tempGoalHours) * 60));
    onUpdateGoal(mins);
    setIsEditingGoal(false);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* CHART 1: 7-Day Study Time Bar Chart (spans 2 cols on lg) */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  7-Day Study Activity
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Daily study hours recorded by the ESP32 smart lamp. Today is highlighted.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-500 inline-block"></span>
                <span className="text-slate-600 dark:text-slate-400">Past Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Today</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={last7Days}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: darkMode ? '#334155' : '#e2e8f0' }}
                />
                <YAxis
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${Math.round(val / 60)}h`}
                />
                <Tooltip
                  content={<Custom7DayTooltip />}
                  cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                />
                <Bar
                  dataKey="totalMinutes"
                  radius={[8, 8, 2, 2]}
                  animationDuration={1000}
                >
                  {last7Days.map((entry, index) => {
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isToday
                            ? '#10b981' // Vibrant Emerald for today
                            : darkMode
                            ? '#6366f1' // Indigo for past days
                            : '#818cf8'
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Insight Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>7-day rolling window in Asia/Kolkata timezone</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Avg: {(last7Days.reduce((acc, d) => acc + (d.totalMinutes || 0), 0) / (last7Days.length || 1) / 60).toFixed(1)}h / day
          </span>
        </div>
      </div>

      {/* CHART 2 & 3: Goal Ring & Today vs Yesterday (stacked in right col) */}
      <div className="flex flex-col gap-6">
        
        {/* Daily Goal Ring Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Goal
              </h2>
            </div>

            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? 'Close' : 'Edit Target'}</span>
            </button>
          </div>

          {/* Goal Editor dropdown / slider */}
          {isEditingGoal && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Target: {tempGoalHours} Hours ({Math.round(tempGoalHours * 60)}m)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={tempGoalHours}
                onChange={(e) => setTempGoalHours(Number(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer mb-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoal}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Circular Progress Ring */}
          <div className="flex items-center justify-center my-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background track */}
                <circle
                  cx="64"
                  cy="64"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Progress bar */}
                <circle
                  cx="64"
                  cy="64"
                  r={circleRadius}
                  stroke="url(#goalGradient)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside circle text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {goalPercent}%
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {todayStats?.formattedTime || '0m'} / {(goalMinutes / 60).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {goalPercent >= 100 ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  🎉 Goal reached for today! Outstanding job!
                </span>
              ) : (
                <span>
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {remainingMinutes > 60 ? `${(remainingMinutes / 60).toFixed(1)}h` : `${remainingMinutes}m`}
                  </strong>{' '}
                  left to reach your daily goal.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Today vs Yesterday Bar Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Today vs Yesterday</span>
            </h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {todayMinutes >= yesterdayMinutes ? 'Surpassing Yesterday' : 'Catching Up'}
            </span>
          </div>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} minutes`, 'Study Time']}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={16}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`comp-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </section>
  );
}
