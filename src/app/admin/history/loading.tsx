import React from 'react';

export default function HistoryLoading() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Header Skeleton */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-6 w-32 sm:w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse" />
      </header>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Navigation Back Button Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-6 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="mb-8 space-y-2 select-none">
          <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4.5 w-96 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mb-8">
          <div className="h-12 w-full max-w-lg bg-slate-100 rounded-2xl animate-pulse" />
          <div className="flex gap-2 items-center overflow-x-auto py-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 w-20 bg-slate-100 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded-md animate-pulse" />
                  <div className="h-4 w-24 bg-slate-100 rounded-md animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse hidden md:block" />
              <div className="h-5 w-24 bg-slate-200 rounded-md animate-pulse hidden sm:block" />
              <div className="h-9 w-24 bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
