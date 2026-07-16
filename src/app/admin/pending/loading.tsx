import React from 'react';

export default function QueueLoading() {
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
          <div className="h-6 w-28 bg-slate-200 rounded-full animate-pulse" />
        </div>

        <div className="mb-8 space-y-2 select-none">
          <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4.5 w-96 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Dynamic Queue Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]"
            >
              <div>
                {/* Image and Meta Row */}
                <div className="flex gap-4 items-start mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse" />
                    <div className="h-6 w-36 bg-slate-200 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3 py-4 border-t border-slate-50">
                  <div className="flex justify-between">
                    <div className="h-4.5 w-16 bg-slate-100 rounded-md animate-pulse" />
                    <div className="h-4.5 w-24 bg-slate-200 rounded-md animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4.5 w-14 bg-slate-100 rounded-md animate-pulse" />
                    <div className="h-4.5 w-28 bg-slate-200 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-4 gap-3">
                <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
