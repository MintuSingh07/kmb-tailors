import React from 'react';

export default function AdminLoading() {
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
        <div className="mb-8 space-y-2 select-none">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4.5 w-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* 6 Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between h-[220px]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-6 bg-slate-100 rounded-xl animate-pulse" />
                <div className="px-8 py-2.5 bg-slate-100 rounded-full animate-pulse" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-28 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-8 w-20 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4 w-48 bg-slate-200 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
