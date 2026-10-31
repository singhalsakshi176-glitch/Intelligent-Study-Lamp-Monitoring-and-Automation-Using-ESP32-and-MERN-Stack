import { useState, useEffect } from 'react';
import './App.css';
import WeeklyChart from './components/WeeklyChart';
import SessionHistoryTable from './components/SessionHistoryTable';
import {
  Lamp,
  Power,
  Sun,
  Moon,
  Clock,
  Target,
  Flame,
  Radio,
  Sliders,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Activity,
  AlertCircle,
  X,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

const ESP32_BASE_URL = (import.meta.env.VITE_ESP32_URL || 'http://192.168.1.50').replace(/\/+$/, '');
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEFAULT_DEVICE_ID || 'esp32-lamp-01';
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

// Format duration into standard "2h 30m" format
function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '0h 0m';
  const total = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

// Format seconds into HH:MM:SS
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
  ].join(':');
}

// Plain fetch for ESP32 with 3-second timeout, NO body and NO custom headers (avoids CORS preflight)
async function callEsp32(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function App() {
  // Theme state: dark / light mode with localStorage persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // LocalStorage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ESP32 Hardware State
  const [esp32Status, setEsp32Status] = useState(null);
  const [esp32Online, setEsp32Online] = useState(false);
  const [esp32Loading, setEsp32Loading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Backend API State
  const [todayStats, setTodayStats] = useState(null);
  const [compareStats, setCompareStats] = useState(null);
  const [backendLampStatus, setBackendLampStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState('');

  // Live running timer state
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  // Polling for ESP32 and Backend independently
  useEffect(() => {
    let isMounted = true;

    async function loadEsp32() {
      try {
        const response = await callEsp32(`${ESP32_BASE_URL}/api/status`, {}, 3000);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setEsp32Status(data);
          setEsp32Online(true);
        }
      } catch {
        if (isMounted) {
          setEsp32Online(false);
        }
      } finally {
        if (isMounted) {
          setEsp32Loading(false);
        }
      }
    }

    async function loadBackend() {
      try {
        const [todayRes, compareRes, lampRes, sessionsRes] = await Promise.all([
          fetch(`${API_URL}/stats/today?deviceId=${encodeURIComponent(DEFAULT_DEVICE_ID)}`).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`${API_URL}/stats/compare?deviceId=${encodeURIComponent(DEFAULT_DEVICE_ID)}`).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`${API_URL}/lamp/status/${encodeURIComponent(DEFAULT_DEVICE_ID)}`).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`${API_URL}/sessions?deviceId=${encodeURIComponent(DEFAULT_DEVICE_ID)}&limit=10`).then((r) =>
            r.ok ? r.json() : null
          ),
        ]);

        if (isMounted) {
          if (todayRes) setTodayStats(todayRes);
          if (compareRes) setCompareStats(compareRes);
          if (lampRes) setBackendLampStatus(lampRes);
          if (Array.isArray(sessionsRes)) setSessions(sessionsRes);

          setBackendOnline(true);
          setBackendError('');
        }
      } catch (err) {
        if (isMounted) {
          setBackendOnline(false);
          setBackendError(err.message || 'Backend connection failed');
        }
      } finally {
        if (isMounted) {
          setBackendLoading(false);
        }
      }
    }

    loadEsp32();
    loadBackend();

    const esp32Interval = setInterval(loadEsp32, POLL_INTERVAL);
    const backendInterval = setInterval(loadBackend, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(esp32Interval);
      clearInterval(backendInterval);
    };
  }, []);

  // Determine if lamp is currently ON based on ESP32 real status
  const isLampOn = Boolean(esp32Online && esp32Status?.lamp === 'ON');

  // Live 1-second clock tick when lamp is ON
  useEffect(() => {
    if (!isLampOn) return;

    let startTime = null;
    if (backendLampStatus?.isOn && backendLampStatus?.since) {
      const d = new Date(backendLampStatus.since);
      if (!isNaN(d.getTime())) startTime = d;
    } else if (todayStats?.activeSessionStartedAt) {
      const d = new Date(todayStats.activeSessionStartedAt);
      if (!isNaN(d.getTime())) startTime = d;
    } else {
      const active = sessions.find((s) => s.isActive || s.endTime === null);
      if (active?.startTime) {
        const d = new Date(active.startTime);
        if (!isNaN(d.getTime())) startTime = d;
      }
    }
    if (!startTime) {
      startTime = new Date();
    }

    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
      setTimerDisplay(formatTime(diffSecs));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLampOn, backendLampStatus, todayStats, sessions]);

  const currentTimer = isLampOn ? timerDisplay : '00:00:00';

  // Helper to re-fetch ESP32 after a user command
  const refreshEsp32 = async () => {
    try {
      const response = await callEsp32(`${ESP32_BASE_URL}/api/status`, {}, 3000);
      if (response.ok) {
        const data = await response.json();
        setEsp32Status(data);
        setEsp32Online(true);
      }
    } catch {
      setEsp32Online(false);
    }
  };

  // ESP32 Hardware Actions: Turn Lamp ON / OFF
  const handleLampCommand = async (targetState) => {
    if (isActionLoading || !esp32Online) return;
    setIsActionLoading(true);
    setActionError('');

    try {
      // Plain POST request with NO body and NO custom headers
      const res = await callEsp32(
        `${ESP32_BASE_URL}/api/lamp?state=${encodeURIComponent(targetState.toLowerCase())}`,
        { method: 'POST' },
        3000
      );

      if (!res.ok) {
        throw new Error(`ESP32 returned status ${res.status}`);
      }

      // Re-poll ESP32 status immediately for responsive UI
      await refreshEsp32();
    } catch (err) {
      console.error('Lamp command failed:', err);
      setActionError(`Failed to turn lamp ${targetState.toUpperCase()}: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ESP32 Hardware Actions: Change Mode (Auto / Manual)
  const handleModeChange = async (targetMode) => {
    if (isActionLoading || !esp32Online) return;
    setIsActionLoading(true);
    setActionError('');

    try {
      // Plain POST request with NO body and NO custom headers
      const res = await callEsp32(
        `${ESP32_BASE_URL}/api/mode?mode=${encodeURIComponent(targetMode.toLowerCase())}`,
        { method: 'POST' },
        3000
      );

      if (!res.ok) {
        throw new Error(`ESP32 returned status ${res.status}`);
      }

      // Re-poll ESP32 status immediately
      await refreshEsp32();
    } catch (err) {
      console.error('Mode command failed:', err);
      setActionError(`Failed to switch mode to ${targetMode}: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format metrics for Card 2 (Today vs Yesterday)
  const todayMinutes = compareStats?.todayMinutes ?? todayStats?.totalMinutes ?? 0;
  const yesterdayMinutes = compareStats?.yesterdayMinutes ?? 0;
  const differenceMinutes = compareStats?.differenceMinutes ?? todayMinutes - yesterdayMinutes;
  const percentChange =
    compareStats?.percentChange ??
    (yesterdayMinutes === 0
      ? todayMinutes > 0
        ? 100
        : 0
      : Math.round((differenceMinutes / yesterdayMinutes) * 100));

  const isMoreThanYesterday = differenceMinutes > 0;
  const isLessThanYesterday = differenceMinutes < 0;

  // Motivational line based on /stats/compare
  let motivationalLine = 'Start a study session today to build your streak!';
  if (isMoreThanYesterday) {
    motivationalLine = 'Awesome work! You studied more than yesterday.';
  } else if (isLessThanYesterday) {
    motivationalLine = 'Keep going! A little more study time to beat yesterday.';
  } else if (todayMinutes > 0) {
    motivationalLine = 'Solid consistency! You are pacing evenly with yesterday.';
  }

  // Current mode from ESP32 status
  const currentMode = esp32Status?.mode
    ? esp32Status.mode.toUpperCase() === 'MANUAL'
      ? 'Manual'
      : 'Auto'
    : 'Auto';

  // Goal Progress Calculations (Default goal 3 hours = 180 minutes)
  const DAILY_GOAL_MINUTES = 180;
  const goalPercent = Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100));
  const remainingMinutes = Math.max(0, DAILY_GOAL_MINUTES - todayMinutes);

  // SVG Progress Ring Geometry
  const ringRadius = 48;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (goalPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <header className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Left: Lamp Icon, Title & Subtitle */}
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 transition-transform hover:scale-105 duration-200 ${
                  isLampOn ? 'lamp-active-glow' : ''
                }`}
              >
                <Lamp className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Smart Study Lamp
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    <Sparkles className="w-3 h-3" />
                    v2.0
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Intelligent Study Lamp Monitoring and ESP32 Automation
                </p>
              </div>
            </div>

            {/* Right: Status Badges & Dark Mode Toggle */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              {/* Lamp Status Live Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isLampOn
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLampOn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{isLampOn ? 'Lamp ON' : 'Lamp OFF'}</span>
              </div>

              {/* ESP32 Status Pill */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  esp32Online
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
                }`}
              >
                {esp32Online ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>{esp32Online ? 'ESP32 Online' : 'ESP32 Offline'}</span>
              </div>

              {/* Backend Status Pill */}
              <div
                className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  backendOnline
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{backendOnline ? 'Backend Connected' : 'Backend Disconnected'}</span>
              </div>

              {/* Device ID Pill */}
              <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                <span>Device:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {DEFAULT_DEVICE_ID}
                </span>
              </div>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-sm text-xs font-semibold cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Action / Backend Error Alert */}
        {(actionError || (!backendOnline && !backendLoading)) && (
          <div
            role="alert"
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm transition-all ${
              actionError
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {actionError ||
                  'Backend is currently disconnected. Hardware controls remain active via direct ESP32 WiFi connection.'}
              </span>
            </div>
            {actionError && (
              <button
                type="button"
                onClick={() => setActionError('')}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* HERO CARD: Today's Study Time with 3h Goal Progress Ring */}
        <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Column: Big Metrics & Status */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                <Target className="w-3.5 h-3.5" />
                <span>Daily Study Goal: 3 Hours</span>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Total Study Time
                </h2>
                <div className="mt-1 flex items-baseline justify-center md:justify-start gap-3">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                    {backendLoading && !todayStats ? 'Loading...' : formatDuration(todayMinutes)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                    / 3h 0m
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg">
                {todayMinutes >= DAILY_GOAL_MINUTES
                  ? '🎉 Outstanding! You have completed your 3-hour study goal for today.'
                  : `${formatDuration(remainingMinutes)} remaining to hit your daily 3-hour goal. Keep up the focus!`}
              </p>

              {/* Live active session indicator when lamp is ON */}
              {isLampOn && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span>Active Session:</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-emerald-700 dark:text-emerald-300">
                    {currentTimer}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Goal Progress Ring (SVG) */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <defs>
                    <linearGradient id="heroProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="72"
                    cy="72"
                    r={ringRadius}
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={ringRadius}
                    stroke="url(#heroProgressGrad)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {goalPercent}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Completed
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <span>{formatDuration(todayMinutes)} Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span>{todayMinutes >= DAILY_GOAL_MINUTES ? '0h 0m' : formatDuration(remainingMinutes)} Left</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Cards Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 1: Lamp Control */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Lamp Control
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct hardware state & mode
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                    !esp32Online
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      : isLampOn
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !esp32Online
                        ? 'bg-slate-400'
                        : isLampOn
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  {esp32Loading
                    ? 'Checking...'
                    : !esp32Online
                    ? 'OFF (Offline)'
                    : isLampOn
                    ? 'ON'
                    : 'OFF'}
                </span>
              </div>

              {/* Large Toggle Switch */}
              <div className="flex flex-col items-center justify-center py-2 mb-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLampOn}
                  onClick={() => handleLampCommand(isLampOn ? 'off' : 'on')}
                  disabled={isActionLoading || !esp32Online}
                  className={`relative inline-flex h-12 w-24 shrink-0 rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    !esp32Online
                      ? 'bg-slate-200 dark:bg-slate-800 opacity-60 cursor-not-allowed'
                      : isLampOn
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer'
                  }`}
                >
                  <span className="sr-only">Toggle Lamp State</span>
                  <span
                    className={`pointer-events-none flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out dark:bg-slate-100 ${
                      isLampOn ? 'translate-x-12 text-emerald-600' : 'translate-x-0 text-slate-400'
                    }`}
                  >
                    {isActionLoading ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    ) : (
                      <Power className="h-5 w-5" />
                    )}
                  </span>
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
                  {isActionLoading
                    ? 'Sending command...'
                    : !esp32Online
                    ? 'ESP32 Offline'
                    : isLampOn
                    ? 'Click to turn OFF'
                    : 'Click to turn ON'}
                </span>
              </div>
            </div>

            {/* Segmented Auto / Manual Mode Control */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Mode
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currentMode} Mode
                </span>
              </div>
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleModeChange('Auto')}
                  disabled={isActionLoading || !esp32Online}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    currentMode === 'Auto'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  } ${isActionLoading || !esp32Online ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('Manual')}
                  disabled={isActionLoading || !esp32Online}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    currentMode === 'Manual'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  } ${isActionLoading || !esp32Online ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Manual
                </button>
              </div>
            </div>
          </section>

          {/* CARD 2: Today vs Yesterday */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Today vs Yesterday
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparative study metrics
                  </p>
                </div>
              </div>

              {/* Two Column Metric Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Today
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {backendLoading && !compareStats && !todayStats
                      ? '—'
                      : formatDuration(todayMinutes)}
                  </div>
                </div>

                <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Yesterday
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-600 dark:text-slate-300">
                    {backendLoading && !compareStats ? '—' : formatDuration(yesterdayMinutes)}
                  </div>
                </div>
              </div>

              {/* Difference & Percent Change Badge */}
              <div className="mb-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    isMoreThanYesterday
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : isLessThanYesterday
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isMoreThanYesterday ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>
                        +{formatDuration(Math.abs(differenceMinutes))} (+{percentChange}%)
                      </span>
                    </>
                  ) : isLessThanYesterday ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>
                        -{formatDuration(Math.abs(differenceMinutes))} ({percentChange}%)
                      </span>
                    </>
                  ) : (
                    <span>— 0h 0m (0%)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Motivational Line */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2">
              <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                {motivationalLine}
              </p>
            </div>
          </section>

          {/* CARD 3: Study Session */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Study Session
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live session tracking
                  </p>
                </div>
              </div>

              {/* Large Stat Display */}
              <div className="mb-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {backendLoading && !todayStats ? 'Loading...' : formatDuration(todayMinutes)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total study time recorded today
                </p>
              </div>

              {/* Active Running Timer / Idle Box */}
              {isLampOn ? (
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Session
                    </span>
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-wider text-emerald-700 dark:text-emerald-300">
                    {currentTimer}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Lamp is idle. Turn on to begin tracking.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Goal: 3h 0m</span>
              <span>{goalPercent}% complete</span>
            </div>
          </section>

          {/* CARD 4: Sensor Monitoring */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Sensor Monitoring
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time hardware telemetry
                  </p>
                </div>
              </div>

              {/* Sensor Readings List */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Ambient Light:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {!esp32Online || !esp32Status
                      ? 'Unavailable'
                      : esp32Status.dark
                      ? 'Dark'
                      : 'Bright'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Student Presence:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    {!esp32Online || !esp32Status
                      ? 'Unavailable'
                      : esp32Status.motion
                      ? 'Motion detected'
                      : 'No motion'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Operating Mode:
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {!esp32Online || !esp32Status ? 'Unavailable' : currentMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom ESP32 Online / Offline Badge */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  esp32Online
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    esp32Online ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                {esp32Online ? 'ESP32 Online' : 'ESP32 Offline'}
              </span>
            </div>
          </section>
        </div>

        {/* 7-Day Study Trend Chart */}
        <WeeklyChart />

        {/* Session History Table */}
        <SessionHistoryTable
          sessions={sessions}
          loading={backendLoading && sessions.length === 0}
          error={backendError && sessions.length === 0 ? 'Backend connection failed' : ''}
          timerDisplay={isLampOn ? currentTimer : ''}
        />

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
          Smart Study Lamp Dashboard &bull; ESP32 WiFi &bull; React + Vite + Tailwind CSS &bull; Node.js + MongoDB
        </footer>
      </div>
    </div>
  );
}

export default App;
