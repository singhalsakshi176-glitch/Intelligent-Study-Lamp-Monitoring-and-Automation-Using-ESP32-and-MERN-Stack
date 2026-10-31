import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, AlertCircle, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEFAULT_DEVICE_ID || 'esp32-lamp-01';
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

// Format duration into "2h 30m" format
function formatDuration(minutes) {
  const rounded = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `${hours}h ${mins}m`;
}

// Derive weekday short name (Mon, Tue...) if not provided by API
function getWeekdayShort(item) {
  if (item.label && typeof item.label === 'string') {
    return item.label;
  }
  if (item.date) {
    try {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return item.date;
    }
  }
  return '';
}

// Check if entry represents today
function isTodayEntry(item) {
  if (typeof item.isToday === 'boolean') {
    return item.isToday;
  }
  if (item.date) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return item.date === `${y}-${m}-${d}`;
  }
  return false;
}

// Custom tooltip showing date and duration in "2h 30m" format
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700/60 shadow-xl rounded-xl px-3.5 py-2 text-center text-xs">
        <p className="font-semibold text-slate-200 mb-0.5">
          {data.date} {data.weekday ? `(${data.weekday})` : ''}
        </p>
        <p className="text-indigo-400 font-bold text-sm">
          {data.formattedDuration}
        </p>
      </div>
    );
  }
  return null;
}

export default function WeeklyChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep track of theme for chart colors
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const baseUrl = API_URL.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/stats/last7days?deviceId=${encodeURIComponent(DEFAULT_DEVICE_ID)}`;

  useEffect(() => {
    let isMounted = true;

    async function fetchStats(isInitial = false) {
      if (isInitial) {
        setLoading(true);
      }
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        if (isMounted) {
          if (Array.isArray(result)) {
            setData(result);
          } else {
            setData([]);
          }
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(`Unable to fetch study time: ${err.message}`);
        }
      } finally {
        if (isMounted && isInitial) {
          setLoading(false);
        }
      }
    }

    fetchStats(true);

    const interval = setInterval(() => {
      fetchStats(false);
    }, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [endpoint]);

  // Format data for Recharts BarChart
  const chartData = data.map((item) => {
    const totalMinutes = Number(item.totalMinutes ?? item.durationMinutes ?? 0);
    const hours = parseFloat((totalMinutes / 60).toFixed(2));
    const isToday = isTodayEntry(item);
    const weekday = getWeekdayShort(item);
    const formattedDuration = formatDuration(totalMinutes);

    return {
      date: item.date || '',
      weekday,
      totalMinutes,
      hours,
      formattedDuration,
      isToday,
    };
  });

  const allZero = chartData.length > 0 && chartData.every((item) => item.totalMinutes === 0);
  const isEmpty = chartData.length === 0 || allZero;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Study Time (Last 7 Days)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily study duration trends and history
            </p>
          </div>
        </div>

        {/* Legend */}
        {!isEmpty && !loading && (
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-md bg-indigo-600 dark:bg-indigo-500" />
              Today
            </span>
            <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-slate-300 dark:bg-slate-700" />
              Previous Days
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading study sessions...</p>
        </div>
      ) : error && chartData.length === 0 ? (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 my-6 max-w-lg mx-auto"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : isEmpty ? (
        <div className="py-14 text-center">
          {error && (
            <div
              role="alert"
              className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No study sessions yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Turn ON your study lamp to begin tracking weekly progress.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1e293b' : '#f1f5f9'}
                />
                <XAxis
                  dataKey="weekday"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="hours"
                  allowDecimals={true}
                  tickFormatter={(val) => `${val}h`}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isToday
                          ? isDark
                            ? '#818cf8'
                            : '#4f46e5'
                          : isDark
                          ? '#334155'
                          : '#cbd5e1'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
