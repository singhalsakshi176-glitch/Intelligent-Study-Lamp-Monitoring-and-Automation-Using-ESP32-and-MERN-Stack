import React from 'react';
import { 
  Lamp, 
  Moon, 
  Sun, 
  RefreshCw, 
  Power, 
  Wifi, 
  Sparkles,
  Radio
} from 'lucide-react';

export default function Navbar({
  lampStatus,
  isLampOn,
  isRefreshing,
  isToggling,
  onToggleLamp,
  onRefresh,
  darkMode,
  onToggleDarkMode,
  deviceId,
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              isLampOn 
                ? 'bg-amber-500/20 text-amber-500 dark:bg-amber-400/20 dark:text-amber-400 ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Lamp className={`w-6 h-6 transition-transform duration-300 ${isLampOn ? 'scale-110 rotate-6' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
                  Smart Study Lamp
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/60">
                  ESP32
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Device: <span className="font-semibold text-slate-700 dark:text-slate-300">{deviceId}</span></span>
              </p>
            </div>
          </div>

          {/* Center/Right Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Live Status Badge */}
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
              isLampOn
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                {isLampOn && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLampOn ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                }`}></span>
              </span>
              <span>{isLampOn ? 'Lamp ON' : 'Lamp OFF'}</span>
            </div>

            {/* Quick Hardware Simulator Button */}
            <button
              onClick={onToggleLamp}
              disabled={isToggling}
              title={isLampOn ? 'Simulate ESP32 Turn OFF' : 'Simulate ESP32 Turn ON'}
              className={`relative group flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                isLampOn
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 dark:bg-indigo-600 dark:hover:bg-indigo-500'
              } ${isToggling ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <Power className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isToggling ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">
                {isLampOn ? 'Turn OFF' : 'Turn ON'}
              </span>
              <span className="md:hidden">
                {isLampOn ? 'OFF' : 'ON'}
              </span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Dashboard"
              aria-label="Refresh Dashboard"
              className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark/Light Mode"
              className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
