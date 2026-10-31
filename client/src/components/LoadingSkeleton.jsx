import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 h-80">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-md mb-6"></div>
          <div className="h-56 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 h-80 flex flex-col justify-center items-center">
          <div className="w-36 h-36 rounded-full border-8 border-slate-200 dark:border-slate-700"></div>
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-md mt-4"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-md mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
