import React from 'react';
import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react';

export default function ConnectionBanner({ error, onRetry, isRetrying }) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-rose-500/5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
          <ServerCrash className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Backend Connection Issue</h4>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
            {error || 'Unable to communicate with the study lamp server. Please check if backend is running on port 5001.'}
          </p>
        </div>
      </div>

      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
