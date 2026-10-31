import { useState, useEffect, useCallback, useRef } from 'react';
import { lampApi } from '../api/lampApi';

const DEFAULT_DEVICE = import.meta.env.VITE_DEFAULT_DEVICE_ID || 'esp32-lamp-01';
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

export function useLampData(initialDeviceId = DEFAULT_DEVICE) {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [lampStatus, setLampStatus] = useState({ isOn: false, since: null });
  const [todayStats, setTodayStats] = useState(null);
  const [compareStats, setCompareStats] = useState(null);
  const [last7Days, setLast7Days] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Live timer state for active session (HH:MM:SS)
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [activeSeconds, setActiveSeconds] = useState(0);

  // Daily goal in minutes (default 3 hours = 180 mins)
  const [goalMinutes, setGoalMinutes] = useState(() => {
    const saved = localStorage.getItem('study_lamp_goal_mins');
    return saved ? Number(saved) : 180;
  });

  const updateGoal = (mins) => {
    setGoalMinutes(mins);
    localStorage.setItem('study_lamp_goal_mins', String(mins));
  };

  // Keep ref for active session start time for smooth 1-second ticks
  const activeSinceRef = useRef(null);

  // Fetch all dashboard data
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statusRes, todayRes, compareRes, sevenDaysRes, sessionsRes] = await Promise.all([
        lampApi.getStatus(deviceId),
        lampApi.getTodayStats(deviceId),
        lampApi.getCompareStats(deviceId),
        lampApi.getLast7Days(deviceId),
        lampApi.getRecentSessions(deviceId, 15),
      ]);

      setLampStatus(statusRes);
      setTodayStats(todayRes);
      setCompareStats(compareRes);
      setLast7Days(Array.isArray(sevenDaysRes) ? sevenDaysRes : []);
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
      activeSinceRef.current = statusRes.isOn && statusRes.since ? new Date(statusRes.since) : null;
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch lamp dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Server connection failed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [deviceId]);

  // Initial fetch and 5-second polling interval
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Live 1-second clock tick when lamp is ON
  useEffect(() => {
    const formatTime = (totalSeconds) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return [
        h.toString().padStart(2, '0'),
        m.toString().padStart(2, '0'),
        s.toString().padStart(2, '0'),
      ].join(':');
    };

    if (lampStatus.isOn && lampStatus.since) {
      const sinceDate = new Date(lampStatus.since);
      const updateTimer = () => {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - sinceDate.getTime()) / 1000));
        setActiveSeconds(diffSeconds);
        setTimerDisplay(formatTime(diffSeconds));
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    } else {
      setTimerDisplay('00:00:00');
      setActiveSeconds(0);
    }
  }, [lampStatus.isOn, lampStatus.since]);

  // Toggle Lamp ON / OFF (for testing ESP32 hardware interactions directly from UI)
  const toggleLamp = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (lampStatus.isOn) {
        await lampApi.turnOff(deviceId);
      } else {
        await lampApi.turnOn(deviceId);
      }
      // Immediate fetch after state toggle
      await fetchData(false);
    } catch (err) {
      console.error('Failed to toggle lamp:', err);
      setError(err.response?.data?.message || 'Failed to toggle lamp state');
    } finally {
      setIsToggling(false);
    }
  };

  return {
    deviceId,
    setDeviceId,
    lampStatus,
    todayStats,
    compareStats,
    last7Days,
    sessions,
    isLoading,
    isRefreshing,
    isToggling,
    error,
    lastUpdated,
    timerDisplay,
    activeSeconds,
    goalMinutes,
    updateGoal,
    toggleLamp,
    refresh: () => fetchData(false),
  };
}
