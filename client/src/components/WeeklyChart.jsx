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
      <div
        style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '13px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#f8fafc' }}>
          {data.date} {data.weekday ? `(${data.weekday})` : ''}
        </p>
        <p style={{ margin: 0, color: '#818cf8', fontWeight: 700 }}>
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
    <section style={cardStyle}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#1e293b' }}>
        📊 Study Time (Last 7 Days)
      </h2>

      {loading ? (
        <p style={{ color: '#64748b', padding: '36px 0', margin: 0 }}>
          Loading study sessions...
        </p>
      ) : error && chartData.length === 0 ? (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            margin: '16px auto',
            maxWidth: '420px',
          }}
        >
          {error}
        </p>
      ) : isEmpty ? (
        <>
          {error && (
            <p
              role="alert"
              style={{
                color: '#b91c1c',
                background: '#fee2e2',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                margin: '0 auto 12px auto',
                maxWidth: '420px',
              }}
            >
              {error}
            </p>
          )}
          <p style={{ color: '#64748b', padding: '36px 0', margin: 0 }}>
            No study sessions yet
          </p>
        </>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              style={{
                color: '#b91c1c',
                background: '#fee2e2',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                margin: '0 auto 12px auto',
                maxWidth: '420px',
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '14px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: '#4f46e5',
                  display: 'inline-block',
                }}
              />
              Today
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: '#cbd5e1',
                  display: 'inline-block',
                }}
              />
              Previous Days
            </span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="weekday"
                  tick={{ fill: '#64748b', fontSize: 13 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="hours"
                  allowDecimals={true}
                  tickFormatter={(val) => `${val}h`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? '#4f46e5' : '#cbd5e1'}
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

const cardStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
  textAlign: 'center',
  marginTop: '20px',
  boxSizing: 'border-box',
};
